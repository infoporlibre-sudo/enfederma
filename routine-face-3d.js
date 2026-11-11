import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// ONLY a 3D scan of a head. The previous Rocketbox full-body avatars are removed.
// Source: Lee Perry-Smith / Infinite-Realities, CC BY 3.0, in Three.js examples.
const URL='https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb';
const stage=document.getElementById('face-stage');
const spots=document.getElementById('spots');
const status=document.getElementById('model-status');
const fallback=stage?.querySelector('img');
if(!stage||!spots||!status)throw Error('Falta el visor facial');

// All anatomical locations in proportions of the face-only bounding box.
// Positions are checked against the true frontal triangle surface.
const locations={
 frente:[[.50,.81]],entrecejo:[[.50,.64]],
 ojos:[[.35,.56],[.65,.56]],
 pomulos:[[.30,.46],[.70,.46]],
 mejillas:[[.27,.39],[.73,.39]],
 nariz:[[.50,.49]],labio:[[.50,.34]],
 menton:[[.50,.18]],
 mandibula:[[.30,.19],[.70,.19]],
 sienes:[[.19,.64],[.81,.64]]
};
const normal=0xaf8076,active=0x67483e;
let object=null,bbox=null,meshes=[],working=false;
const scene=new THREE.Scene();
const root=new THREE.Group();scene.add(root);
scene.add(new THREE.HemisphereLight(0xffffff,0xcdaaa0,2.5));
const key=new THREE.DirectionalLight(0xffe4d6,3.2);key.position.set(-3,4,6);scene.add(key);
const fill=new THREE.DirectionalLight(0xfff7eb,2.1);fill.position.set(3,1,4);scene.add(fill);
const camera=new THREE.PerspectiveCamera(35,1,.1,100);
camera.position.set(0,0,5);
const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.8));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.14;
renderer.domElement.className='face-3d-canvas';
renderer.domElement.setAttribute('aria-label','Rostro 3D. Arrastra para girarlo y toca los puntos de la cara.');
stage.prepend(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;
controls.minPolarAngle=Math.PI*.28;controls.maxPolarAngle=Math.PI*.73;
controls.minAzimuthAngle=-Math.PI*.42;controls.maxAzimuthAngle=Math.PI*.42;
let currentDistance=5;
function resize(){
 const w=stage.clientWidth,h=stage.clientHeight;
 if(!w||!h)return;
 camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
 if(object)fitCamera();
}
const observer=new ResizeObserver(resize);observer.observe(stage);

const ray=new THREE.Raycaster();
const cursor=new THREE.Vector2();
const markers=[],hitTargets=[];
const geometry=new THREE.SphereGeometry(.047,18,14);
const centerGeometry=new THREE.SphereGeometry(.018,12,10);
function clearMarkers(){
 markers.forEach(o=>{o.parent?.remove(o);o.material?.dispose()});
 markers.length=0;hitTargets.length=0;
}
function makeMarker(zone,position){
 const body=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:normal,roughness:.35,metalness:.06}));
 const white=new THREE.Mesh(centerGeometry,new THREE.MeshBasicMaterial({color:0xffffff}));
 body.position.copy(position);white.position.copy(position);white.position.z+=.034;
 for(const mesh of [body,white]){mesh.userData.zone=zone;root.add(mesh);markers.push(mesh);hitTargets.push(mesh)}
}
function sync(){
 const selected=new Set([...document.querySelectorAll('.zone-button[aria-pressed="true"]')].map(x=>x.dataset.zone));
 for(const m of markers)if(m.geometry===geometry)m.material.color.set(selected.has(m.userData.zone)?active:normal);
}
window.addEventListener('routine:zone-change',sync);
function surface(x,y){
 const b=bbox,size=b.getSize(new THREE.Vector3());
 const rx=size.x*.043,ry=size.y*.026;
 for(const [ox,oy] of [[0,0],[-rx,0],[rx,0],[0,-ry],[0,ry]]){
  ray.set(new THREE.Vector3(x+ox,y+oy,b.max.z+5),new THREE.Vector3(0,0,-1));
  const hits=ray.intersectObjects(meshes,true);
  if(hits.length)return hits[0].point.clone().add(new THREE.Vector3(0,0,.055));
 }
 return null; // Never position a free-floating point outside the face.
}
function placeMarkers(){
 clearMarkers();
 const b=bbox,s=b.getSize(new THREE.Vector3());
 for(const [zone,pairs] of Object.entries(locations)){
  for(const [fx,fy] of pairs){
   const p=surface(b.min.x+s.x*fx,b.min.y+s.y*fy);
   if(p)makeMarker(zone,p);
  }
 }
 sync();
}
function fitCamera(){
 if(!bbox)return;
 const s=bbox.getSize(new THREE.Vector3());
 const fov=THREE.MathUtils.degToRad(camera.fov);
 const hFov=2*Math.atan(Math.tan(fov/2)*camera.aspect);
 const dist=Math.max(s.y*1.28/(2*Math.tan(fov/2)),s.x*1.22/(2*Math.tan(hFov/2)));
 const target=new THREE.Vector3(0,-s.y*.045,0);
 controls.target.copy(target);
 camera.position.copy(target).add(new THREE.Vector3(0,0,dist));
 controls.minDistance=dist*.75;
 controls.maxDistance=dist*2;
 currentDistance=dist;
 controls.update();controls.saveState();
}
function fallbackMode(message){
 working=false;renderer.domElement.style.display='none';
 fallback&&(fallback.style.visibility='visible');
 spots.style.display='';
 status.textContent=message;
}
new GLTFLoader().load(URL,gltf=>{
 object=gltf.scene;
 object.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(object);
 const size=box.getSize(new THREE.Vector3()),c=box.getCenter(new THREE.Vector3());
 // Uniformly normalize head-only scan to a predictable size.
 const k=2.7/Math.max(.01,size.y);
 object.scale.setScalar(k);
 object.position.set(-c.x*k,-c.y*k,-c.z*k);
 root.add(object);object.updateMatrixWorld(true);
 bbox=new THREE.Box3().setFromObject(object);
 object.traverse(n=>{if(n.isMesh){meshes.push(n);n.frustumCulled=false}});
 if(!meshes.length)throw Error('La malla facial está vacía.');
 placeMarkers();fitCamera();
 working=true;fallback&&(fallback.style.visibility='hidden');
 spots.style.display='none';
 status.textContent='Rostro 3D interactivo. Arrastra para girar, acerca y toca los puntos.';
},undefined,()=>fallbackMode('El modelo 3D no se ha cargado. Puedes usar la imagen y la lista de zonas.'));
const down={x:0,y:0};
renderer.domElement.addEventListener('pointerdown',e=>{down.x=e.clientX;down.y=e.clientY});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!working||Math.hypot(down.x-e.clientX,down.y-e.clientY)>9)return;
 const r=renderer.domElement.getBoundingClientRect();
 cursor.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
 ray.setFromCamera(cursor,camera);
 const spotHit=ray.intersectObjects(hitTargets,false)[0];
 if(!spotHit)return;
 // The marker must not be behind the face from the current camera position.
 const faceHit=ray.intersectObjects(meshes,true)[0];
 if(faceHit&&faceHit.distance<spotHit.distance-.12)return;
 const id=spotHit.object.userData.zone;
 document.querySelector('.zone-button[data-zone="'+id+'"]')?.click();
});
document.getElementById('face-reset')?.addEventListener('click',()=>controls.reset());
document.getElementById('face-zoom-in')?.addEventListener('click',()=>{
 const d=camera.position.clone().sub(controls.target);
 if(d.length()>controls.minDistance*1.08){camera.position.copy(controls.target).add(d.multiplyScalar(.86));controls.update()}
});
document.getElementById('face-zoom-out')?.addEventListener('click',()=>{
 const d=camera.position.clone().sub(controls.target);
 if(d.length()<controls.maxDistance*.92){camera.position.copy(controls.target).add(d.multiplyScalar(1.16));controls.update()}
});
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)}
animate();resize();
