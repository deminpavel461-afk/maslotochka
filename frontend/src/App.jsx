import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Advantages from './components/Advantages.jsx';
import Pricing from './components/Pricing.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Locations from './components/Locations.jsx';
import Trust from './components/Trust.jsx';
import BookingForm from './components/BookingForm.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Advantages />
        <Pricing />
        <HowItWorks />
        <Locations />
        <Trust />
        <BookingForm />
      </main>
      <Footer />
    </>
  );
}
