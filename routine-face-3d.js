import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

/* Licensed 3D head: Lee Perry-Smith / Infinite-Realities, CC BY 3.0.
 * https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb
 * Interactive anchors are computed from ray/mesh intersections, so points rotate with the face.
 */
const stage=document.getElementById('face-stage');
const holder=document.getElementById('spots');
const img=stage?.querySelector('img');
const status=document.getElementById('model-status');
if(!stage || !holder) throw new Error('Contenedor de rostro no encontrado');

const zoneCoordinates={
 frente:[.50,.25], entrecejo:[.50,.40], ojos:[.34,.47], pomulos:[.30,.60],
 mejillas:[.71,.60], nariz:[.50,.56], labio:[.50,.68], menton:[.50,.83],
 mandibula:[.73,.81], sienes:[.25,.42]
};
const canvasRenderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
canvasRenderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
canvasRenderer.outputColorSpace=THREE.SRGBColorSpace;
canvasRenderer.toneMapping=THREE.ACESFilmicToneMapping;
canvasRenderer.toneMappingExposure=1.2;
canvasRenderer.domElement.className='face-3d-canvas';
canvasRenderer.domElement.setAttribute('aria-label','Rostro humano tridimensional interactivo. Arrastra para girar y utiliza la rueda o pellizca para ampliar.');
stage.prepend(canvasRenderer.domElement);

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,1,.1,100);
camera.position.set(0,0,6.3);
scene.add(new THREE.HemisphereLight(0xffffff,0xe2b4a2,2.3));
const soft=new THREE.DirectionalLight(0xffe8d5,3);soft.position.set(-3,4,6);scene.add(soft);
const fill=new THREE.DirectionalLight(0xe7c8bd,2.2);fill.position.set(4,2,-3);scene.add(fill);

const modelGroup=new THREE.Group();scene.add(modelGroup);
const markerGroup=new THREE.Group();modelGroup.add(markerGroup);
const control=new OrbitControls(camera,canvasRenderer.domElement);
control.enableDamping=true;control.dampingFactor=.08;
control.enablePan=false;control.minDistance=4;control.maxDistance=9;
control.minPolarAngle=Math.PI*.30;control.maxPolarAngle=Math.PI*.70;
control.minAzimuthAngle=-Math.PI*.38;control.maxAzimuthAngle=Math.PI*.38;
control.target.set(0,0,0);
const pointer=new THREE.Vector2(),ray=new THREE.Raycaster();
let ready=false,placed=new Map();
const materialNormal=new THREE.MeshStandardMaterial({color:0xad7d70,emissive:0x8e5748,emissiveIntensity:.12,metalness:.08,roughness:.32});
const materialSelected=new THREE.MeshStandardMaterial({color:0x75483c,emissive:0xc89a71,emissiveIntensity:.65,metalness:.10,roughness:.25});
const ringGeo=new THREE.SphereGeometry(.079,16,12);
const pulseGeo=new THREE.SphereGeometry(.035,12,10);
const markerMeshes=[];
function makeMarker(id,point){
 const outer=new THREE.Mesh(ringGeo,materialNormal.clone());
 const center=new THREE.Mesh(pulseGeo,new THREE.MeshBasicMaterial({color:0xffffff}));
 outer.position.copy(point);center.position.copy(point);center.position.z+=.061;
 outer.userData.zone=id;center.userData.zone=id;
 markerGroup.add(outer,center);markerMeshes.push(outer,center);placed.set(id,outer);
}
function updateSelection(){
 for(const [id,mesh] of placed)mesh.material.color.set(document.querySelector('[data-zone="'+id+'"]')?.getAttribute('aria-pressed')==='true' ? 0x75483c : 0xad7d70);
}
window.addEventListener('routine:zone-change',updateSelection);
function doResize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();canvasRenderer.setSize(w,h,false)}
new ResizeObserver(doResize).observe(stage);
function findAnchor(x,y,zFront,meshes){
 const origin=new THREE.Vector3(x,y,zFront+4);
 ray.set(origin,new THREE.Vector3(0,0,-1));
 const hit=ray.intersectObjects(meshes,true)[0];
 return hit ? hit.point.clone().add(new THREE.Vector3(0,0,.08)) : new THREE.Vector3(x,y,zFront-.55);
}
function load(){
 status.textContent='Cargando rostro 3D…';
 const loader=new GLTFLoader();
 loader.load('https://threejs.org/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb',gltf=>{
   const head=gltf.scene;
   head.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.side=THREE.DoubleSide}});
   const box=new THREE.Box3().setFromObject(head),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
   const scale=3.25/Math.max(size.y,.1);
   head.scale.setScalar(scale);head.position.set(-center.x*scale,-center.y*scale,-center.z*scale);
   modelGroup.add(head);
   const bounds=new THREE.Box3().setFromObject(head);
   const min=bounds.min,max=bounds.max,dim=bounds.getSize(new THREE.Vector3());
   const meshes=[];head.traverse(o=>{if(o.isMesh)meshes.push(o)});
   for(const [id,xy] of Object.entries(zoneCoordinates)){
      const x=min.x+xy[0]*dim.x,y=max.y-xy[1]*dim.y;
      makeMarker(id,findAnchor(x,y,max.z,meshes));
   }
   ready=true;
   if(img)img.style.visibility='hidden';
   holder.style.display='none';
   status.textContent='Gira el rostro con el dedo o el ratón. Toca un punto para seleccionar una zona.';
   updateSelection();doResize();
 },undefined,err=>{
   console.warn('No se pudo cargar el modelo 3D',err);
   canvasRenderer.domElement.style.display='none';
   if(img)img.style.visibility='visible';
   holder.style.display='';
   status.textContent='El modelo 3D no se ha cargado. Puedes seguir seleccionando las zonas en la imagen o la lista.';
 });
}
const mouseDown={x:0,y:0};
canvasRenderer.domElement.addEventListener('pointerdown',e=>{mouseDown.x=e.clientX;mouseDown.y=e.clientY});
canvasRenderer.domElement.addEventListener('pointerup',e=>{
 if(!ready || Math.hypot(e.clientX-mouseDown.x,e.clientY-mouseDown.y)>8)return;
 const rect=canvasRenderer.domElement.getBoundingClientRect();
 pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height*2-1));
 ray.setFromCamera(pointer,camera);
 const hits=ray.intersectObjects(markerMeshes,false);
 if(hits.length){const id=hits[0].object.userData.zone;document.querySelector('.zone-button[data-zone="'+id+'"]')?.click()}
});
document.getElementById('face-reset')?.addEventListener('click',()=>{
 camera.position.set(0,0,6.3);control.target.set(0,0,0);control.reset();
});
document.getElementById('face-zoom-in')?.addEventListener('click',()=>{camera.position.multiplyScalar(.84);control.update()});
document.getElementById('face-zoom-out')?.addEventListener('click',()=>{camera.position.multiplyScalar(1.17);control.update()});
const clock=new THREE.Clock();
function render(){requestAnimationFrame(render);control.update(clock.getDelta());canvasRenderer.render(scene,camera)}
render();load();
