import Head from "next/head";
import CodeEditor from '../components/CodeEditor';

export default function Home() {
  return (
    <div>
      <Head>
        <title>NexusHub - Code Editor</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CodeEditor />
    </div>
  );
}
