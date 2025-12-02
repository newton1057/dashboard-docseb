import logo from "../assets/logo.png";
import logoLight from "../assets/logo_mode_light.png";

export function ButterflyIcon({
  width = "34px",
  alt = "MentalBeat logo",
  className,
  style,
  appearance,
  ...props
}) {
  const source = appearance === "Claro" ? logoLight : logo;
  return (
    <img
      src={source}
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
