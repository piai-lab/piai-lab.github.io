import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const products = [
  {
    name: "OmniScholar",
    image: "omnischolar",
    zh: "从一个问题、一篇论文出发，连接证据与深入研究",
    en: "Connect questions and papers with evidence and deeper research",
  },
  {
    name: "OmniSketch",
    image: "omnisketch",
    zh: "将科学机制与研究思路，转化为清晰、可编辑的科研图示",
    en: "Turn scientific mechanisms and research ideas into clear, editable figures",
  },
  {
    name: "OmniPlotter",
    image: "omniplotter",
    zh: "让研究数据成为准确、可复现的科学图表",
    en: "Turn research data into accurate, reproducible scientific charts",
  },
  {
    name: "Haros",
    image: "haros",
    zh: "在同一工作台中，组织多种智能体完成持续的科研工作",
    en: "Bring research agents together in one workspace for ongoing scientific work",
  },
];

export default function ProductShowcase({ zh }: { zh: boolean }) {
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);
  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);
  const move = (index: number) =>
    api?.scrollTo(
      index,
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  return (
    <Carousel
      className="product-showcase"
      opts={{ loop: true, align: "center" }}
      setApi={setApi}
      aria-label={zh ? "科研产品" : "Research products"}
    >
      <CarouselContent className="product-track ml-0">
        {products.map((product, index) => (
          <CarouselItem
            key={product.name}
            className={`product-slide pl-0 ${selected === index ? "is-selected" : ""}`}
            aria-label={`${index + 1} / ${products.length}: ${product.name}`}
          >
            <figure>
              <div className="product-screenshot">
                <img
                  src={`/products/${product.image}.png`}
                  alt={`${product.name} ${zh ? "产品首页" : "home screen"}`}
                  draggable={false}
                />
              </div>
              <figcaption>
                <h3>{product.name}</h3>
                <p className="product-caption-copy">
                  {zh ? product.zh : product.en}
                </p>
              </figcaption>
            </figure>
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="product-controls">
        <div
          className="product-selector"
          aria-label={zh ? "选择产品" : "Choose product"}
        >
          {products.map((product, index) => (
            <button
              type="button"
              key={product.name}
              aria-pressed={selected === index}
              onClick={() => move(index)}
            >
              <span>{product.name}</span>
              <small>{zh ? product.zh : product.en}</small>
            </button>
          ))}
        </div>
      </div>
    </Carousel>
  );
}
