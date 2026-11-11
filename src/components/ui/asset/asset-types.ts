import type { StaticImageData } from "next/image";
import type { ComponentType, SVGProps } from "react";

export type AssetSvgComponent = ComponentType<SVGProps<SVGSVGElement>>;

export type AssetImageSource = string | StaticImageData | AssetSvgComponent;

export type AssetFit = "cover" | "contain" | "fill" | "none";

type AssetBaseProps = {
  width: number;
  height: number;
  fit?: AssetFit;
  className?: string;
  mediaClassName?: string;
};

export type AssetImageProps = AssetBaseProps & {
  type: "image";
  src: AssetImageSource;
  alt: string;
  sizes?: string;
  quality?: number;
  blurDataURL?: string | null;
  priority?: boolean;
  loading?: "eager" | "lazy";
};

export type AssetVideoProps = AssetBaseProps & {
  type: "video";
  src: string;
  poster: string;
  stillPoster?: string;
  alt?: string;
  mobileSrc?: string;
};

/**
 * The kit also exposes `rive` and `lottie` asset variants; both require
 * runtime packages (`@rive-app/react-canvas`, `lottie-react`) that this app
 * does not depend on, so those two variants are intentionally omitted.
 */
export type AssetProps = AssetImageProps | AssetVideoProps;
