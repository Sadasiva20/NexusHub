import Head from 'next/head';
import SchemaEditor from '../components/SchemaEditor';

export default function SchemaPage() {
  return (
    <>
      <Head>
        <title>NexusHub - Schema Builder</title>
        <meta name="description" content="Build and validate Storyblok component schemas." />
      </Head>
      <SchemaEditor />
    </>
  );
}
