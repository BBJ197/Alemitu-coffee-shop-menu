import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import About from "../components/About";
import Menu from "../components/Menu";
import Contact from "../components/Contact";
import Footer from "../components/Footer";

export default function LandingPage() {
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
