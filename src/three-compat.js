// Compatibilité Three.js pour mind-ar 1.2.5
import * as THREE from 'three';

// Ajouter les propriétés dépréciées
if (THREE.WebGLRenderer) {
  // sRGBEncoding a été remplacé par .outputColorSpace = THREE.SRGBColorSpace
  THREE.sRGBEncoding = 3001; // Valeur originale dans Three.js v142
}

export default THREE;
