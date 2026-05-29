import { QRCodeSVG } from "qrcode.react";

interface IdCardProps {
  studentId: string;
  name: string;
  course: string;
  photoBase64: string;
}

export function IdCard({ studentId, name, course, photoBase64 }: IdCardProps) {
  const qrValue = `https://www.youtube.com/watch?v=c69V5V-Yvss`;

  return (
    <div
      className="relative overflow-hidden bg-white text-black border border-gray-300 shadow-md select-none print:shadow-none print:border-gray-400"
      style={{
        width: "85.6mm",
        height: "54mm",
        boxSizing: "border-box",
        fontFamily: "var(--font-poppins), sans-serif"
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between z-25"
        style={{
          height: "11.5mm",
          backgroundColor: "#060280",
          borderBottom: "0.8mm solid #4A0E2E",
          paddingLeft: "2mm",
          paddingRight: "2mm",
          paddingTop: "1.4mm",
          paddingBottom: "2mm",
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            fontFamily: "'Arial Black', Impact, 'Arial Narrow Bold', sans-serif",
            fontSize: "10mm",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1,
            letterSpacing: "0em"
          }}
        >
          ISM
        </div>
        <div className="text-right flex flex-col justify-center leading-none">
          <div
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              fontSize: "12px",
              fontWeight: "bold",
              textTransform: "uppercase",
              letterSpacing: "0.02em",
              color: "#ffffff",
              lineHeight: 1.2
            }}
          >
            Computer • IT • Fire & Safety
          </div>
          <div
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#ffffff",
              marginTop: "2px",
              lineHeight: 1
            }}
          >
            8539910031 • 8539910032
          </div>
        </div>
      </div>

      <div
        style={{
          width: "35mm",
          height: "42mm",
          borderRadius: "50%",
          backgroundColor: "#4A0E2E",
          position: "absolute",
          left: "1.5mm",
          top: "5mm",
          zIndex: 15
        }}
      ></div>

      <div
        style={{
          width: "30mm",
          height: "30mm",
          borderRadius: "50%",
          border: "2.5px solid #ffffff",
          overflow: "hidden",
          position: "absolute",
          left: "4.2mm",
          top: "15mm",
          zIndex: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)"
        }}
      >
        {photoBase64 ? (
          <img
            src={photoBase64}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400 font-bold bg-gray-200">
            PHOTO
          </div>
        )}
      </div>

      <div
        style={{
          position: "absolute",
          left: "40mm",
          top: "14mm",
          fontFamily: "var(--font-poppins), sans-serif",
          fontSize: "19px",
          fontWeight: "bold",
          color: "#000000",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          zIndex: 10,
          letterSpacing: "-0.5px"
        }}
      >
        {name || "STUDENT NAME"}
      </div>

      <div
        style={{
          position: "absolute",
          left: "40mm",
          top: "22.5mm",
          fontFamily: "var(--font-poppins), sans-serif",
          fontSize: "15px",
          fontWeight: "800",
          color: "#000000",
          textTransform: "uppercase",
          zIndex: 10
        }}
      >
        {studentId || "ID-NUMBER"}
      </div>

      <div
        style={{
          position: "absolute",
          left: "40mm",
          top: "27.5mm",
          fontFamily: "var(--font-poppins), sans-serif",
          fontSize: "15px",
          fontWeight: "800",
          color: "#000000",
          textTransform: "uppercase",
          zIndex: 10
        }}
      >
        {course || "COURSE"}
      </div>

      <div
        style={{
          position: "absolute",
          right: "3mm",
          top: "22.5mm",
          width: "15mm",
          height: "15mm",
          border: "0.8px solid #4A0E2E",
          backgroundColor: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10
        }}
      >
        <QRCodeSVG value={qrValue} size={50} level="H" />
        <div
          className="absolute inset-0 m-auto rounded-full flex items-center justify-center text-white font-black"
          style={{
            width: "3.6mm",
            height: "3.6mm",
            backgroundColor: "#060280",
            border: "0.6px solid #ffffff",
            fontSize: "3.2px",
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          ISM
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "14mm",
          backgroundColor: "#060280",
          borderTop: "0.8mm solid #4A0E2E",
          // borderBottom: "0.8mm solid #4A0E2E",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: "36mm",
          zIndex: 10,
          boxSizing: "border-box"
        }}
      >
        <div
          className="flex items-center gap-1.5 leading-none"
          style={{ marginTop: "0.2mm", marginBottom: "0.2mm" }}
        >
          <span
            className="flex-shrink-0 rounded-full border bg-white border-white"
            style={{ width: "1.1mm", height: "1.1mm" }}
          ></span>
          <span
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              fontSize: "9px",
              fontWeight: "bold",
              color: "#ffffff"
            }}
          >
            Near DAV College More
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 leading-none"
          style={{ marginTop: "1mm", marginBottom: "1mm" }}
        >
          <span
            className="flex-shrink-0 rounded-full border bg-white border-white"
            style={{ width: "1.1mm", height: "1.1mm" }}
          ></span>
          <span
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              fontSize: "9px",
              fontWeight: "bold",
              color: "#ffffff"
            }}
          >
            Near Babunia More
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 leading-none"
          style={{ marginTop: "0.2mm", marginBottom: "0.2mm" }}
        >
          <span
            className="flex-shrink-0 rounded-full border bg-white border-white"
            style={{ width: "1.1mm", height: "1.1mm" }}
          ></span>
          <span
            style={{
              fontFamily: "var(--font-poppins), sans-serif",
              fontSize: "9px",
              fontWeight: "bold",
              color: "#ffffff"
            }}
          >
            Near Malviya Chowk Mahadeva
          </span>
        </div>
      </div>
    </div>
  );
}
