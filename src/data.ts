import {
  faLocationCrosshairs,
  faPhone,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";
import { faClock } from "@fortawesome/free-regular-svg-icons";
import {
  faFacebook,
  faInstagram,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";
import hotBeverages from "./assets/images/hot-beveragrs.webp";
import coldBeverages from "./assets/images/cold-beveragrs.webp";
import refreshment from "./assets/images/refreshment.webp";
import fastingFoods from "./assets/images/fasting-foods.webp";
import nonFastingFoods from "./assets/images/non-fasting-foods.webp";
import dessert from "./assets/images/dessert.webp";

import user1 from "./assets/images/User-1.jpeg";
import user2 from "./assets/images/user-2.jpg";
import user3 from "./assets/images/user-3.jpeg";
import user4 from "./assets/images/user-4.jpg";
import user5 from "./assets/images/user-5.webp";

export const menuItems = [
  {
    id: 1,
    name: "Hot Beverages",
    image: hotBeverages,
    text: "Wide range of Steaming hot coffee to make you fresh and light.",
  },
  {
    id: 2,
    name: "Cold Beverages",
    image: coldBeverages,
    text: "Creamy and frothy cold Tej and Tela to make you cool.",
  },
  {
    id: 3,
    name: "Refreshment",
    image: refreshment,
    text: "Fruit and icy refreshing drink to make feel refresh.",
  },
  {
    id: 4,
    name: "Fasting foods",
    image: fastingFoods,
    text: "Delicious Ethiopian fasting dishes made with simple, flavorful plant-based ingredients.",
  },
  {
    id: 5,
    name: "Non Fasting Foods",
    image: nonFastingFoods,
    text: "Popular Ethiopian dishes featuring flavorful meat, rich spices, and traditional ingredients.",
  },
  {
    id: 6,
    name: "Dessert",
    image: dessert,
    text: "Satiate your palate and take you on a culinary treat.",
  },
];

export const testimonials = [
  {
    id: 1,
    name: "Eden Shemsu",
    image: user1,
    feedback:
      "Loved the French roast. Perfectly balanced and rich. Will order again!",
  },
  {
    id: 2,
    name: "Yosef Bekele",
    image: user2,
    feedback:
      "Great espresso blend! Smooth and bold flavor. Fast shipping too!",
  },
  {
    id: 3,
    name: "Michael Kidus",
    image: user3,
    feedback: "Fantastic mocha flavor. Fresh and aromatic. Quick shipping!",
  },
  {
    id: 4,
    name: "Sara Yohans",
    image: user4,
    feedback:
      "Excellent quality! Fresh beans and quick delivery. Highly recommend.",
  },
  {
    id: 5,
    name: "Tariku Abebe",
    image: user5,
    feedback: "Best decaf I've tried! Smooth and flavorful. Arrived promptly.",
  },
];

export const contactInfo = [
  {
    id: 1,
    icon: faLocationCrosshairs,
    text: "Jambo Building, Addisu Gebeya, Addis Ababa, Ethiopia, Ground Floor, No. 013",
  },
  { id: 3, icon: faPhone, text: "(251) 985-414412" },
  {
    id: 4,
    icon: faClock,
    text: "Tuesday - Sunday: 9:00 AM - 5:00 PM",
  },
  { id: 5, icon: faClock, text: "Monday: Closed" },
  { id: 6, icon: faGlobe, text: "www.alemitucoffee.com" },
];

export const socialLinks = [
  { id: "facebook", label: "Facebook", icon: faFacebook, href: "" },
  { id: "instagram", label: "Instagram", icon: faInstagram, href: "" },
  { id: "x", label: "X (Twitter)", icon: faXTwitter, href: "" },
];
