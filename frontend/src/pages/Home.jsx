import React from 'react';

export default function Home() {
  return (
    <div className="container section" style={{ textAlign: 'center', maxWidth: 720 }}>
      <h2 style={{ color: 'var(--brand)', fontWeight: 800, marginTop: 0 }}>
        Librăria Ta Online
      </h2>
      <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7 }}>
        Bine ai venit la <b>Librăria Scriptum</b> 📚 <br />
        Un colț de liniște digitală, unde poți răsfoi romane, eseuri, albume de artă,
        cărți pentru copii și titluri de non-ficțiune atent alese. <br />
        Creează-ți propriul raft de lecturi, adaugă titlurile preferate în coș și 
        lasă-te inspirat de recomandările noastre curatoriate.
      </p>

      <img
        src="https://cdn-icons-png.flaticon.com/512/2232/2232688.png"
        alt="Stack of books"
        style={{ width: 130, marginTop: 22, opacity: 0.9 }}
      />
    </div>
  );
}
