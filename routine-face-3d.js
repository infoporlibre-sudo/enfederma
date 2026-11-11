import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Microsoft Rocketbox female/male avatars, MIT License.
// Bundled in @interviewflowai/talking-avatar; the UI itself has no audio.
const ASSETS = Object.freeze({
  mujer:'https://cdn.jsdelivr.net/npm/@interviewflowai/talking-avatar@0.3.0/dist/avatars/female.glb',
  hombre:'https://cdn.jsdelivr.net/npm/@interviewflowai/talking-avatar@0.3.0/dist/avatars/male.glb'
});
const stage=document.getElementById('face-stage');
const holder=document.getElementById('spots');
const status=document.getElementById('model-status');
const photo=stage?.querySelector('img');
const btns=[...document.querySelectorAll('[data-mannequin]')];
if(!stage||!holder||!status) throw new Error('No se encuentra el visor de Enfederma.');
const coords={
  frente:[[.5,.81]], entrecejo:[[.5,.62]],
  ojos:[[.31,.57],[.69,.57]],
  pomulos:[[.28,.45],[.72,.45]],
  mejillas:[[.27,.41],[.73,.41]],
  nariz:[[.5,.49]], labio:[[.5,.34]], menton:[[.5,.20]],
  mandibula:[[.24,.16],[.76,.16]],
  sienes:[[.15,.65],[.85,.65]],
  escote:[[.5,-.22]]
};
/* Coordenadas en fracciones de la caja del rostro, NO de la caja de todo el avatar.
 * Para colocar cada punto, se intersecta un rayo frontal con la superficie real. */
let selectedGender='mujer', loadedToken=0, ready=false, headMeshes=[], headBox;
const root=new THREE.Group(),pinGroup=new THREE.Group();
const pointMeshes=[],pinByZone=new Map();
let model;
// Recortamos el maniquí por debajo del cuello para evitar mostrar torso o cuerpo.
const cutPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);

const scene=new THREE.Scene();scene.add(root);root.add(pinGroup);
scene.add(new THREE.HemisphereLight(0xffffff,0xa28370,2.4));
const key=new THREE.DirectionalLight(0xfff3de,3.0);key.position.set(-2,4,6);scene.add(key);
const fill=new THREE.DirectionalLight(0xe7bbaf,1.6);fill.position.set(3,1,3);scene.add(fill);
const camera=new THREE.PerspectiveCamera(35,1,.1,100);
camera.position.set(0,0,6);
const webgl=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
webgl.outputColorSpace=THREE.SRGBColorSpace;
webgl.localClippingEnabled=true;
webgl.toneMapping=THREE.ACESFilmicToneMapping;
webgl.toneMappingExposure=1.12;
webgl.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
webgl.domElement.className='face-3d-canvas';
webgl.domElement.setAttribute('aria-label','Modelo tridimensional humano. Arrastra para girar, pellizca para ampliar y toca los puntos para seleccionar zonas.');
stage.prepend(webgl.domElement);
const controls=new OrbitControls(camera,webgl.domElement);
controls.enablePan=false;
controls.enableDamping=true;
controls.dampingFactor=.09;
controls.minDistance=2.3;controls.maxDistance=7.5;
controls.minPolarAngle=Math.PI*.28;controls.maxPolarAngle=Math.PI*.73;
controls.minAzimuthAngle=-Math.PI*.42;controls.maxAzimuthAngle=Math.PI*.42;
const ray=new THREE.Raycaster(),cursor=new THREE.Vector2();
const outerGeometry=new THREE.SphereGeometry(.055,20,16);
const innerGeometry=new THREE.SphereGeometry(.020,12,10);
const normalColor=0xa87569, selectedColor=0x67483e;
let viewerMessage='';

function clearModel(){
  pinGroup.clear();pinByZone.clear();pointMeshes.length=0;
  if(model){root.remove(model);model.traverse(o=>{if(o.isMesh){if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()}});model=null;}
}
function resize(){
 const w=stage.clientWidth,h=stage.clientHeight;
 if(w&&h){camera.aspect=w/h;camera.updateProjectionMatrix();webgl.setSize(w,h,false);}
}
new ResizeObserver(resize).observe(stage);
function selectionState(){
 for(const [id,meshes] of pinByZone.entries()){
  const zone=document.querySelector('.zone-button[data-zone="'+id+'"]');
  const color=zone?.getAttribute('aria-pressed')==='true'?selectedColor:normalColor;
  for(const mesh of meshes)mesh.material.color.set(color);
 }
}
window.addEventListener('routine:zone-change',selectionState);
function measureFace(rootModel){
 const faceCandidates=[];
 rootModel.traverse(node=>{if(node.isMesh && node.morphTargetDictionary && Object.keys(node.morphTargetDictionary).length)faceCandidates.push(node)});
 const box=new THREE.Box3();
 if(faceCandidates.length){for(const node of faceCandidates)box.expandByObject(node);}
 else box.setFromObject(rootModel);
 if(box.isEmpty())box.setFromObject(rootModel);
 return box;
}
function makePin(id,point){
 const mat=new THREE.MeshStandardMaterial({color:normalColor,metalness:.17,roughness:.38,depthTest:true});
 const pin=new THREE.Mesh(outerGeometry,mat);
 const dot=new THREE.Mesh(innerGeometry,new THREE.MeshBasicMaterial({color:0xfffbf8,depthTest:true}));
 pin.position.copy(point);dot.position.copy(point);dot.position.z+=.039;
 pin.userData.zone=id;dot.userData.zone=id;
 pinGroup.add(pin,dot);pointMeshes.push(pin,dot);
 if(!pinByZone.has(id))pinByZone.set(id,[]);
 pinByZone.get(id).push(pin);
}
function surface(x,y,z,dim){
 const radius=Math.max(.015,dim.x*.055);
 // First intersect the actual face surface; small anatomical adjustments help
 // avoid empty space at the temples, jaw and neckline.
 const offsets=[[0,0],[-radius,0],[radius,0],[0,-radius],[0,radius],
                [-radius*.6,-radius*.5],[radius*.6,radius*.5]];
 for(const [dx,dy] of offsets){
  ray.set(new THREE.Vector3(x+dx,y+dy,z+4),new THREE.Vector3(0,0,-1));
  const hit=ray.intersectObjects(headMeshes,true)[0];
  if(hit) return hit.point.clone().add(new THREE.Vector3(0,0,.05));
 }
 return null; // Never place a floating hotspot outside the mannequin.
}
function placePins(){
 pinGroup.clear();pinByZone.clear();pointMeshes.length=0;
 const b=headBox,dim=b.getSize(new THREE.Vector3());
 const z=b.max.z;
 for(const [id,positions] of Object.entries(coords)){
   for(const [nx,ny] of positions){
     let x=b.min.x+nx*dim.x;
     let y=b.min.y+ny*dim.y;
     if(id==='escote'){
       // Manubrium/upper décolletage: measured relative to the chin,
       // NEVER relative to the feet of a full-body model.
       x=(b.min.x+b.max.x)/2;
       y=b.min.y-dim.y*.10;
     }
     const point=surface(x,y,z,dim);
     if(point)makePin(id,point);
   }
 }
 selectionState();
}
async function loadAvatar(gender){
 const token=++loadedToken;ready=false;
 selectedGender=gender;
 status.textContent='Cargando maniquí 3D de '+(gender==='mujer'?'mujer':'hombre')+'…';
 btns.forEach(b=>{const active=b.dataset.mannequin===gender;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
 try{sessionStorage.setItem('enfederma-maniqui',gender)}catch{}
 try{
   await MeshoptDecoder.ready;
   const loader=new GLTFLoader();loader.setMeshoptDecoder(MeshoptDecoder);
   const gltf=await loader.loadAsync(ASSETS[gender]);
   if(token!==loadedToken)return;
   clearModel();model=gltf.scene;
   model.updateMatrixWorld(true);
   let b=measureFace(model);
   const scale=2.6/Math.max(.01,b.getSize(new THREE.Vector3()).y);
   model.scale.setScalar(scale);model.updateMatrixWorld(true);
   b=measureFace(model);
   const center=b.getCenter(new THREE.Vector3());
   model.position.sub(center);model.updateMatrixWorld(true);
   root.add(model);
   headBox=measureFace(model);
   const faceSize=headBox.getSize(new THREE.Vector3());
   const faceHeight=faceSize.y;
   // Solo cara y un poco de cuello; ocultar todo el torso aunque el GLB sea de cuerpo entero.
   const lowerFaceCut=headBox.min.y-faceHeight*.15;
   cutPlane.constant=-lowerFaceCut;
   headMeshes=[];
   model.traverse(n=>{
     if(!n.isMesh)return;
     n.frustumCulled=false;
     n.material=Array.isArray(n.material)?n.material.map(m=>m.clone()):n.material.clone();
     for(const mat of Array.isArray(n.material)?n.material:[n.material]){
       mat.clippingPlanes=[cutPlane];
       mat.clipShadows=true;
       mat.needsUpdate=true;
     }
     headMeshes.push(n);
   });
   placePins();
   // Primer plano calculado a partir del tamaño REAL de la cabeza, no del cuerpo.
   // Ajustar en horizontal y vertical para evitar cortar sienes o frente en móvil.
   const cameraTarget=new THREE.Vector3(0,-faceHeight*.045,0);
   const verticalFov=THREE.MathUtils.degToRad(camera.fov);
   const horizontalFov=2*Math.atan(Math.tan(verticalFov/2)*camera.aspect);
   const distance=Math.max(
     (faceHeight*1.15)/(2*Math.tan(verticalFov/2)),
     (faceSize.x*1.12)/(2*Math.tan(horizontalFov/2))
   );
   controls.target.copy(cameraTarget);
   camera.position.copy(cameraTarget).add(new THREE.Vector3(0,0,distance));
   controls.minDistance=distance*.78;
   controls.maxDistance=distance*1.75;
   controls.update();controls.saveState();
   if(photo)photo.style.visibility='hidden';
   holder.style.display='none';
   ready=true;resize();
   status.textContent='Vista de rostro y cuello. Gira la cara y selecciona tus zonas.';
 }catch(error){
   console.warn('No se pudo cargar el avatar 3D',error);
   ready=false;clearModel();
   if(photo)photo.style.visibility='visible';
   holder.style.display='';
   status.textContent='No se ha podido cargar el 3D. Puedes seleccionar las zonas en la lista o en la imagen.';
 }
}
btns.forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mannequin!==selectedGender)loadAvatar(b.dataset.mannequin)}));
const down={x:0,y:0};
webgl.domElement.addEventListener('pointerdown',e=>{down.x=e.clientX;down.y=e.clientY});
webgl.domElement.addEventListener('pointerup',e=>{
 if(!ready||Math.hypot(e.clientX-down.x,e.clientY-down.y)>8)return;
 const rect=webgl.domElement.getBoundingClientRect();
 cursor.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
 ray.setFromCamera(cursor,camera);
 const selectedHit=ray.intersectObjects(pointMeshes,false)[0];
 if(!selectedHit)return;
 // Prevent selecting a point hidden on the opposite side of the head.
 const skinHit=ray.intersectObjects(headMeshes,true)[0];
 if(skinHit && selectedHit.distance>skinHit.distance+.12)return;
 const id=selectedHit.object.userData.zone;
 document.querySelector('.zone-button[data-zone="'+id+'"]')?.click();
});
document.getElementById('face-reset')?.addEventListener('click',()=>controls.reset());
document.getElementById('face-zoom-in')?.addEventListener('click',()=>{
 const v=camera.position.clone().sub(controls.target);
 if(v.length()>controls.minDistance+.25){camera.position.copy(controls.target).add(v.multiplyScalar(.85));controls.update();}
});
document.getElementById('face-zoom-out')?.addEventListener('click',()=>{
 const v=camera.position.clone().sub(controls.target);
 if(v.length()<controls.maxDistance-.25){camera.position.copy(controls.target).add(v.multiplyScalar(1.15));controls.update();}
});
function draw(){requestAnimationFrame(draw);controls.update();webgl.render(scene,camera);}
draw();
let saved='mujer';try{saved=sessionStorage.getItem('enfederma-maniqui')==='hombre'?'hombre':'mujer'}catch{}
loadAvatar(saved);
