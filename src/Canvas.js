import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture, AccumulativeShadows, RandomizedLight, Decal, Environment, Center, Loader, Float } from '@react-three/drei'
import { easing } from 'maath'
import { useSnapshot } from 'valtio'
import { state } from './store'

export const App = ({ position = [0, 0, 2.5], fov = 25 }) => (
  <>
    <Canvas shadows camera={{ position, fov }} gl={{ preserveDrawingBuffer: true }} eventSource={document.getElementById('root')} eventPrefix="client">
      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr" />
        <CameraRig>
          <Backdrop />
          <Center>
            <Shirt />
          </Center>
        </CameraRig>
      </Suspense>
    </Canvas>
    <Loader />
  </>
)

function Backdrop() {
  const shadows = useRef()
  useFrame((state, delta) => easing.dampC(shadows.current.getMesh().material.color, state.color, 0.25, delta))
  return (
    <AccumulativeShadows ref={shadows} temporal frames={60} alphaTest={0.85} scale={10} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.14]}>
      <RandomizedLight amount={4} radius={9} intensity={0.55} ambient={0.25} position={[5, 5, -10]} />
      <RandomizedLight amount={4} radius={5} intensity={0.25} ambient={0.55} position={[-5, 5, -9]} />
    </AccumulativeShadows>
  )
}

function CameraRig({ children }) {
  const group = useRef()
  const snap = useSnapshot(state)
  useFrame((state, delta) => {
    easing.damp3(state.camera.position, [snap.intro ? -state.viewport.width / 4 : 0, 0, 2], 0.25, delta)
    easing.dampE(group.current.rotation, [state.pointer.y / 10, -state.pointer.x / 5, 0], 0.25, delta)
  })
  return <group ref={group}>{children}</group>
}

function Shirt(props) {
  const snap = useSnapshot(state)
  const texture = useTexture(`/${snap.decal}.png`)
  const { nodes, materials } = useGLTF('/shirt_baked_collapsed.glb')
  useFrame((state, delta) => easing.dampC(materials.lambert1.color, snap.color, 0.25, delta))
  return (
    <Float
      speed={1} // Animation speed, defaults to 1
      rotationIntensity={1} // XYZ rotation intensity, defaults to 1
      floatIntensity={0.1} // Up/down float intensity, works like a multiplier with floatingRange,defaults to 1
      // floatingRange={[1, 10]} // Range of y-axis values the object will float within, defaults to [-0.1,0.1]
    >
      <mesh castShadow geometry={nodes.T_Shirt_male.geometry} material={materials.lambert1} material-roughness={1} {...props} dispose={null}>
        <Decal position={[0, 0.04, 0.15]} rotation={[0, 0, 0]} scale={0.15} map={texture} map-anisotropy={16} />
      </mesh>
    </Float>
  )
}

useGLTF.preload('/shirt_baked_collapsed.glb')
;['/react.png', '/three2.png', '/LR_fill_2.png', '/LR_back_2.png'].forEach(useTexture.preload)
