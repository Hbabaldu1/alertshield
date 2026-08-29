import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>AlertShield 🇳🇬 | Anti-Fake Alert & Instant Virtual Account Soundbox</title>
        <meta name="description" content="Instant bank transfer verification, audio cashier soundbox, and dynamic virtual account invoicing for Nigerian merchants." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
