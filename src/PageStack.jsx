import { useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { useEffect, useRef, useState } from "react";
import { clamp } from "three/src/math/MathUtils";
import { useAppStore } from "./App";

export default function PageStack(props) {
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

  // Inversed exponential distrubution for starting position,
  // top of the stack will be closer to the center while most of the stack will be closer to the edges.
  // This is the closest I found correlating to the design
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

  /********************* Functions to move pages over the canvas *********************/
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
  /********************* End of functions to move pages over the canvas *********************/

  // Render the initial stack of pages
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
   * Set up event listeners for next and previous buttons.
   */
  useEffect(() => {
    // Don't set up event listeners until all pages are rendered with a ref
    if (refs.length !== pageData.length) return;

    /**
     * The next functionality will move the first page of the total stack to the center
     * or move the center page to the end of the stack and move the next page to the center
     * or move the last page to the end of the stack.
     */
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

    /**
     * The previous functionality will move the last page from the total stack to the center
     * or move the center page to the start of the stack and move the previous page to the center
     * or move the first page to the start of the stack.
     */
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

    // Make a copy of the 3D mesh references to create the starting stack.
    // By the time this runs, all the pages will have been initialized.
    startStack.current = [...refs];

    // Set up event listeners.
    setOnNext(() => onNext);
    setOnPrev(() => onPrev);
  }, [refs, pageData, setOnNext, setOnPrev, setActiveTitle, setActiveContent]);

  return renderInitialStack();
}

/**
 * A simple page mesh with a texture provided by the props
 * This could be more fancy :-)
 */
function PageSlide(props) {
  const { map } = props;
  const meshRef = useRef(); // This reference will give us direct access to the mesh
  const materialProps = useTexture({
    map: map || "jcb-page-mock.png",
  });

  // Once initialized, add the mesh to the array of parent page stack component
  useEffect(() => {
    if (!meshRef.current) return;

    props.setRefs((prev) => [...prev, meshRef]);
  }, [meshRef.current]);

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh ref={meshRef} castShadow receiveShadow {...props}>
      <boxGeometry args={props.dimension} />
      <meshBasicMaterial {...materialProps} />
    </mesh>
  );
}
