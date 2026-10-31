import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Menu from "../components/Menu";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { useReveal } from "../lib/useReveal";

export default function LandingPage() {
  useReveal();
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <About />
        <Menu />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
