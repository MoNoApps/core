import config from "../config";

export const Footer: React.FC = () => {
  return (
    <footer
      className="theme-adaptive-footer"
      style={{
        padding: "24px 0",
        marginTop: "auto",
        flexShrink: 0,
        fontSize: 13,
      }}
    >
      <div
        className="container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <strong>{config.site || "Core"}</strong> &copy;{" "}
          {new Date().getFullYear()} Core contributors.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
