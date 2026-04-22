import { redirect } from 'next/navigation';

export default function Home() {
  // When users scan the physical QR, they hit this page and are sent to the Figma site.
  redirect('https://safe-plasma-73330377.figma.site/');
}
