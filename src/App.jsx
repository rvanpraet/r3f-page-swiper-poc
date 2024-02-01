import { SoftShadows, useHelper } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useControls } from "leva";
import { useRef, useState } from "react";
import { DirectionalLightHelper, DoubleSide } from "three";
import { create } from "zustand";
import "./App.css";
import PageContent from "./PageContent";
import PageStack from "./PageStack";
import { mockPageData } from "./assets/mockData";

/**
 * Zustand store for linking the page content to the THREE.JS canvas
 * Docs: https://github.com/pmndrs/zustand
 */
export const useAppStore = create((set) => ({
  activeTitle: "Related",
  activeContent:
    'Here comes a short description about what this relationship type means. The object is a book. Carousel starting position: first item in the group. Fields from Luna Images items - "Image Function" and “Item Description”',
  setActiveTitle: (title) => set({ activeTitle: title }),
  setActiveContent: (content) => set({ activeContent: content }),
}));

/**
 * Proof of concept for a 3D page stack. I've assumed that a user will browse through the pages from right to left.
 * The starting pages will be on the right side of the screen and the ending pages will be on the left side of the screen.
 * Notable TODOs:
 *
 * - Obviously a way to receive data from BE (either fetch or passed through Django)
 * - Add more entries to the mockData for more accurate results
 * - Color of background plane to match the color of the website background, the color code is the same but due to the lightning it looks different
 */
function App() {
  // Debug controls for the canvas
  const { shadowsEnabled, ...config } = useControls({
    shadowsEnabled: true,
    size: { value: 15, min: 0, max: 100 },
    focus: { value: 1, min: 0, max: 2 },
    samples: { value: 10, min: 1, max: 20, step: 1 },
  });

  // I have not found another way to pass button functions to the canvas in R3F
  // the buttons live outside canvas and same level/higher in the DOM tree
  const [onNext, setOnNext] = useState(() => {});
  const [onPrev, setOnPrev] = useState(() => {});

  // Could be in a fetch hook, could be passed as props to this component
  const pageData = [...mockPageData];

  // Some POC styling, llikely not relevant for the final code
  const style = {
    position: "fixed",
    inset: "40% 0 0 0",
  };

  return (
    <>
      {/* Page content container */}
      <div style={{ height: "40vh", width: "100vw" }}>
        <PageContent />
      </div>

      {/* Canvas container */}
      <div style={style}>
        <Canvas className="canvas-container" shadows>
          {shadowsEnabled && <SoftShadows {...config} />}
          <color attach="background" args={[0xfaf9f8]} />
          <Light />
          <BackgroundPlane />
          <PageStack
            pageData={pageData}
            setOnNext={setOnNext}
            setOnPrev={setOnPrev}
          />
          <axesHelper args={[5]} />
        </Canvas>
      </div>

      {/* Buttons for browsing through the pages */}
      <div className="nav-buttons-wrapper">
        <button onClick={onPrev}>Previous</button>
        <button onClick={onNext}>Next</button>
      </div>
    </>
  );
}

export default App;

/**
 * A background plane for the scene to receive shadows from the pages
 * As mentioned in the top of the file, the color of the plane should match the color of the website background
 */
function BackgroundPlane(props) {
  const { viewport } = useThree();
  const planeWidth = viewport.width;
  const planeHeight = viewport.height;

  return (
    <mesh position={[0, 0, -0.1]} {...props} receiveShadow>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshStandardMaterial color={0xfaf9f8} side={DoubleSide} />
    </mesh>
  );
}

/**
 * The lights for the scene
 */
function Light() {
  const dirLight = useRef(null);
  useHelper(dirLight, DirectionalLightHelper, "red");

  return (
    <>
      <ambientLight color={0xffffff} intensity={0.5} />
      <directionalLight
        ref={dirLight}
        castShadow
        position={[0, 0, 2]}
        intensity={1}
        shadow-mapSize={1024}
        color={0xffffff}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-10, 10, -10, 10, 0.1, 50]}
        />
      </directionalLight>
    </>
  );
}
