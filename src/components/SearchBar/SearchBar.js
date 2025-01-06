import React from 'react';

function SearchBar({ searchTerm, setSearchTerm }) {
  return (
    <div style={{ margin: '20px 0', display: 'flex', justifyContent: 'center' }}>
      <input
        type="text"
        placeholder="Search requests..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: '10px',
          width: '80%',
          maxWidth: '500px',
          borderRadius: '20px',
          border: '1px solid #ccc',
          fontSize: '16px'
        }}
      />
    </div>
  );
}

export default SearchBar;
