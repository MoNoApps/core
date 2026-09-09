import config from "../config";

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: "1px solid #e7e7e7",
        padding: "24px 0",
        marginTop: "auto",
        backgroundColor: "rgba(0,0,0,0.02)",
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
          <strong>{config.site || "MoNoApps Core"}</strong> &copy;{" "}
          {new Date().getFullYear()} Dan Matz & contributors.
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span className="label label-default">Node.js 24 LTS</span>
          <span className="label label-default">MongoDB 8.x</span>
          <span className="label label-default">React 19 + TypeScript</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
