import localFont from 'next/font/local';

export const instrumentSans = localFont({
  src: './fonts/InstrumentSans-Variable.woff2',
  display: 'swap',
  style: 'normal',
  weight: '400 700',
  variable: '--font-instrument-sans',
});

export const ibmPlexMono = localFont({
  src: [
    {
      path: './fonts/IBMPlexMono-Regular.woff2',
      style: 'normal',
      weight: '400',
    },
    {
      path: './fonts/IBMPlexMono-Medium.woff2',
      style: 'normal',
      weight: '500',
    },
  ],
  display: 'swap',
  variable: '--font-ibm-plex-mono',
});
