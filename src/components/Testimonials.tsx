import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Navigation } from "swiper/modules";
import { testimonials } from "../data";

export default function Testimonials() {
  return (
    <section className="testimonials-section" id="testimonials">
      <h2 className="section-title">Testimonials</h2>
      <div className="section-content">
        <Swiper
          className="slider-container"
          modules={[Pagination, Navigation]}
          loop={true}
          grabCursor={true}
          spaceBetween={25}
          pagination={{ clickable: true, dynamicBullets: true }}
          navigation={true}
          breakpoints={{
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
        >
          {testimonials.map((t) => (
            <SwiperSlide className="testimonial" key={t.id}>
              <img src={t.image} alt="" className="user-image" />
              <h3 className="name">{t.name}</h3>
              <i className="feedback">"{t.feedback}"</i>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
