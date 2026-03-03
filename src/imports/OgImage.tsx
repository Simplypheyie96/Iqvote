export default function OgImage() {
  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #781444 31.731%, #ff007a 75%, #ff5caa 100%)',
      }}
    >
      {/* Top abstract image */}
      <div
        style={{
          position: 'absolute',
          top: '39px',
          left: '31px',
          width: '1138px',
          height: '394px',
        }}
      >
        <img
          src="/og-assets/og-bg.png"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>

      {/* Decorative lines */}
      <div
        style={{
          position: 'absolute',
          top: '454px',
          left: '71px',
          width: '1058px',
          height: '167px',
        }}
      >
        <img
          src="/og-assets/og-lines.png"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
        />
      </div>

      {/* Braindao logo */}
      <div
        style={{
          position: 'absolute',
          top: '461px',
          left: '181px',
          width: '140px',
          height: '159px',
        }}
      >
        <img
          src="/og-assets/og-logo.png"
          alt="IQ Logo"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
      </div>

      {/* IQ VOTE text */}
      <div
        style={{
          position: 'absolute',
          top: '490px',
          left: '445px',
          fontFamily: "'Syne', 'Arial Black', sans-serif",
          fontWeight: 700,
          fontSize: '80px',
          color: '#000000',
          letterSpacing: '-2.4px',
          lineHeight: 0.9,
          whiteSpace: 'nowrap',
        }}
      >
        IQ VOTE
      </div>
    </div>
  );
}
