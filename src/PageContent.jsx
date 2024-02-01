import { useAppStore } from "./App";

/**
 * Mock HTML content linked to the global state of the app
 */
export default function PageContent(props) {
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
