import logo from "../assets/logo.png";

export function ButterflyIcon({ width = "34px", alt = "MentalBeat logo", className, style, ...props }) {
  return (
    <img
      src={logo}
      alt={alt}
      draggable={false}
      loading="lazy"
      decoding="async"
      className={className}
      style={{
        display: "block",
        width,
        height: "auto",
        objectFit: "contain",
        ...style,
      }}
      {...props}
    />
  );
}