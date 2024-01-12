import { SoftShadows, useHelper, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useControls } from "leva";
import { useEffect, useRef, useState } from "react";
import { DirectionalLightHelper, DoubleSide } from "three";
import { clamp } from "three/src/math/MathUtils";
import { create } from "zustand";
import "./App.css";

// Mock data for 20 pages
const mockPageData = [
  {
    title: "Page 1",
    content: "Mock content for page 1",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 2",
    content: "Mock content for page 2",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 3",
    content: "Mock content for page 3",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 4",
    content: "Mock content for page 4",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 5",
    content: "Mock content for page 5",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 6",
    content: "Mock content for page 6",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 7",
    content: "Mock content for page 7",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 8",
    content: "Mock content for page 8",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 9",
    content: "Mock content for page 9",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 10",
    content: "Mock content for page 10",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 11",
    content: "Mock content for page 11",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 12",
    content: "Mock content for page 12",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 13",
    content: "Mock content for page 13",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 14",
    content: "Mock content for page 14",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 15",
    content: "Mock content for page 15",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 16",
    content: "Mock content for page 16",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 17",
    content: "Mock content for page 17",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 18",
    content: "Mock content for page 18",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 19",
    content: "Mock content for page 19",
    map: "jcb-page-mock.png",
  },
  {
    title: "Page 20",
    content: "Mock content for page 20",
    map: "jcb-page-mock.png",
  },
];
const useAppStore = create((set) => ({
  activeTitle: "Related",
  activeContent:
    'Here comes a short description about what this relationship type means. The object is a book. Carousel starting position: first item in the group. Fields from Luna Images items - "Image Function" and “Item Description”',
  setActiveTitle: (title) => set({ activeTitle: title }),
  setActiveContent: (content) => set({ activeContent: content }),
}));

function App() {
  const { shadowsEnabled, ...config } = useControls({
    shadowsEnabled: true,
    size: { value: 15, min: 0, max: 100 },
    focus: { value: 1, min: 0, max: 2 },
    samples: { value: 10, min: 1, max: 20, step: 1 },
  });

  // I have not found another way to pass button functions to the canvas in R3F
  const [onNext, setOnNext] = useState(() => {});
  const [onPrev, setOnPrev] = useState(() => {});

  // Could be in a fetch hook
  const pageData = [...mockPageData];

  const style = {
    position: "fixed",
    inset: "40% 0 0 0",
  };

  return (
    <>
      <div style={{ height: "40vh", width: "100vw" }}>
        <PageContent />
      </div>
      <div style={style}>
        <Canvas className="canvas-container" shadows>
          {/* <color attach="background" args={[0x000000]} /> */}
          {shadowsEnabled && <SoftShadows {...config} />}
          <color attach="background" args={[0xfaf9f8]} />
          <Light />
          {/* <pointLight position={[10, 10, 10]} /> */}
          {/* <Box position={[2, 0, 2]} castShadow /> */}
          <BackgroundPlane />
          <Pagestack
            pageData={pageData}
            setOnNext={setOnNext}
            setOnPrev={setOnPrev}
          />
          {/* <OrbitControls /> */}
          <axesHelper args={[5]} />
        </Canvas>
      </div>
      <div className="nav-buttons-wrapper">
        <button onClick={onPrev}>Previous</button>
        <button onClick={onNext}>Next</button>
      </div>
    </>
  );
}

export default App;

function PageContent(props) {
  return (
    <div className="page-content">
      <Title />
      <Content />
    </div>
  );
}

function Title() {
  const activeTitle = useAppStore((state) => state.activeTitle);

  return <h1>{activeTitle}</h1>;
}

function Content() {
  const activeContent = useAppStore((state) => state.activeContent);

  return <p>{activeContent}</p>;
}

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

function Pagestack(props) {
  const { pageData, setOnNext, setOnPrev } = props;
  const viewport = useThree((state) => state.viewport);
  const setActiveTitle = useAppStore((state) => state.setActiveTitle);
  const setActiveContent = useAppStore((state) => state.setActiveContent);

  // Refs to all the page meshes
  const [refs, setRefs] = useState([]);
  const startStack = useRef([]);
  const endStack = useRef([]);

  // Refs to the active page and its index in the mesh ref array
  const activePageMeshRef = useRef(null);

  // Animation constants
  const ANIMATION_DURATION = 1;
  const ANIMATION_EASE = "rough";

  // Values to determine the position of the pages in each stack
  const pageWidth = viewport.width * 0.125;
  const pageHeight = pageWidth * 1.33;
  const maxNegX = -(viewport.width / 2) + pageWidth * 0.75;
  const maxPosX = viewport.width / 2 - pageWidth * 0.75;

  // const getStartXPos = (index) => maxPosX - pageWidth * index * 0.25
  // const getStartXPos = (index) =>
  //   maxPosX -
  //   maxPosX * Math.exp(-(pageData.length - 1 - index) * pageWidth * 0.25);
  // const getStartXPos = (index) => maxPosX - Math.log(index * pageWidth * 2);

  // Inversed exponential distrubution for starting position,
  // top of the stack will be closer to the center while most of the stack will be closer to the edges
  const getStartXPos = (index) =>
    clamp(
      maxPosX -
        maxPosX * Math.exp(-(pageData.length - 1 - index) * pageWidth * 0.25) -
        index * 0.1,
      pageWidth * 1.25,
      maxPosX
    );

  const getEndXPos = (index) =>
    clamp(
      maxNegX -
        maxNegX * Math.exp(-(pageData.length - 1 - index) * pageWidth * 0.25) +
        index * 0.1,
      maxNegX,
      -pageWidth * 1.25
    );

  // Y and Z positions are slightly randomized
  const getYPos = (index) => -0.15 + Math.random() * 0.3;
  const getZPos = (index) => (index * 0.1) / pageData.length + 0.075;

  //Starting pagestack to the right should be filled with pages and offset on x-axis

  /**
   * Functions for moving pages around
   */
  const moveToCenter = (config) => {
    const { meshRef, delay = 0 } = config;

    gsap.to(meshRef.current.position, {
      duration: ANIMATION_DURATION,
      x: 0,
      y: 0,
      z: 2,
      ease: ANIMATION_EASE,
      delay,
    });
    gsap.to(meshRef.current.rotation, {
      duration: ANIMATION_DURATION,
      z: 0,
      ease: ANIMATION_EASE,
      delay,
      onComplete: () => {},
    });
  };

  const moveToStartStack = (config) => {
    const { meshRef, index } = config;

    console.log("index :::  ", index);

    gsap.to(meshRef.current.position, {
      duration: ANIMATION_DURATION,
      x: getStartXPos(index),
      y: getYPos(index),
      z: getZPos(index),
      ease: ANIMATION_EASE,
    });
    gsap.to(meshRef.current.rotation, {
      duration: ANIMATION_DURATION,
      z: -0.1 + Math.random() * 0.2,
      ease: ANIMATION_EASE,
    });
  };

  const moveToEndStack = (config) => {
    const { meshRef, index, delay = 0 } = config;
    const endIdx = pageData.length - 1 - index; // Index of end stack is inverse of ref/start stack

    // Animations using gsap
    gsap.to(meshRef.current.position, {
      duration: ANIMATION_DURATION,
      x: getEndXPos(endIdx),
      y: getYPos(endIdx),
      z: getZPos(endIdx),
      delay,
      ease: ANIMATION_EASE,
    });
    gsap.to(meshRef.current.rotation, {
      duration: ANIMATION_DURATION,
      z: -0.1 + Math.random() * 0.2,
      delay,
      ease: ANIMATION_EASE,
    });
  };

  const renderInitialStack = () =>
    pageData.map((page, i) => {
      return (
        <PageSlide
          key={i}
          map={page.map}
          position={[getStartXPos(i), getYPos(i), getZPos(i)]}
          dimension={[pageWidth, pageHeight, 0.001]}
          rotation={[0, 0, -0.1 + Math.random() * 0.2]}
          onClick={(e) => onPageClick(e, i)}
          setRefs={setRefs}
        />
      );
    });

  /**
   * Set up event listeners for next and previous
   */
  useEffect(() => {
    // Don't set up event listeners until all pages are rendered with a ref
    if (refs.length !== pageData.length) return;

    const onNext = () => {
      // No more pages to browse, return
      if (activePageMeshRef.current === null && startStack.current.length === 0)
        return;

      // Get current active mesh or the top page from the starting stack
      const meshRef = activePageMeshRef.current || startStack.current.pop();

      let nextMeshRef = null;
      const index = refs.findIndex(
        (ref) => ref.current.uuid === meshRef.current.uuid
      );
      // const index = startStack.length - 1;
      // const meshRef = refs[index];

      console.log("index ::: ", index);

      // If there is no active page, move the first page to the center
      if (!activePageMeshRef.current) {
        moveToCenter({ meshRef });
        setActiveTitle(pageData[index].title);
        setActiveContent(pageData[index].content);

        activePageMeshRef.current = meshRef;
      }

      // Move active page to the end, then mov e the next page to the center
      else {
        moveToEndStack({ meshRef, index });
        endStack.current.push(activePageMeshRef.current);

        if (startStack.current.length > 0) {
          nextMeshRef = startStack.current.pop();
          const nextIndex = refs.findIndex(
            (ref) => ref.current.uuid === nextMeshRef.current.uuid
          );

          console.log("nextIndex ::: ", nextIndex);
          moveToCenter({ meshRef: nextMeshRef, delay: 0.075 });
          setActiveTitle(pageData[nextIndex].title);
          setActiveContent(pageData[nextIndex].content);
        }

        activePageMeshRef.current = nextMeshRef;
      }
    };

    const onPrev = () => {
      // Stack hasn't been browsed, can't go previous
      if (!activePageMeshRef.current && endStack.current.length === 0) return;

      // Get mesh ref for current active page or the top page in the endstack
      const meshRef = activePageMeshRef.current || endStack.current.pop();
      let nextMeshRef = null;
      const index = refs.findIndex(
        (ref) => ref.current.uuid === meshRef.current.uuid
      );

      // Only the top page is in the center
      if (!activePageMeshRef.current) {
        moveToCenter({ meshRef });
        setActiveTitle(pageData[index].title);
        setActiveContent(pageData[index].content);

        activePageMeshRef.current = meshRef;
      }

      // Move active page to the end, then move the next page to the center
      else {
        moveToStartStack({ meshRef, index });
        startStack.current.push(activePageMeshRef.current);

        if (endStack.current.length > 0) {
          nextMeshRef = endStack.current.pop();
          const nextIndex = refs.findIndex(
            (ref) => ref.current.uuid === nextMeshRef.current.uuid
          );

          moveToCenter({ meshRef: nextMeshRef, delay: 0.075 });
          setActiveTitle(pageData[nextIndex].title);
          setActiveContent(pageData[nextIndex].content);
        }

        activePageMeshRef.current = nextMeshRef;
      }
    };

    startStack.current = [...refs];
    console.log("done setting up event listeners", startStack);

    setOnNext(() => onNext);
    setOnPrev(() => onPrev);
  }, [refs, pageData, setOnNext, setOnPrev, setActiveTitle, setActiveContent]);

  return renderInitialStack();
}

function PageSlide(props) {
  // This reference will give us direct access to the mesh
  const { map } = props;
  const meshRef = useRef();
  const materialProps = useTexture({
    map: map || "jcb-page-mock.png",
  });

  useEffect(() => {
    if (!meshRef.current) return;

    props.setRefs((prev) => [...prev, meshRef]);
  }, [meshRef.current]);

  console.log("position ::: ", props.position);

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh ref={meshRef} castShadow receiveShadow {...props}>
      <boxGeometry args={props.dimension} />
      <meshBasicMaterial {...materialProps} />
    </mesh>
  );
}

// A plane that functions as background for the scene
function BackgroundPlane(props) {
  const { viewport } = useThree();
  const planeWidth = viewport.width;
  const planeHeight = viewport.height;

  return (
    <mesh position={[0, 0, -0.1]} {...props} receiveShadow>
      <planeGeometry args={[planeWidth, planeHeight]} />
      {/* <meshStandardMaterial color={0xfaf9f8} side={DoubleSide} /> */}
      <meshStandardMaterial color={0xffffff} side={DoubleSide} />
    </mesh>
  );
}

function Box(props) {
  // This reference will give us direct access to the mesh
  const meshRef = useRef();

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => (meshRef.current.rotation.x += delta));

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
    </mesh>
  );
}
