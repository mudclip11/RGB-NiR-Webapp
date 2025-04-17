import React, { useState } from 'react';

function TextureSelector(texture, setTexture) {
  const imageOptions = [
    { name: '1930s', url: '/tex1.png' },
    { name: '1940s', url: '/tex2.png' },
    { name: '1970s', url: '/tex3.png' },
    { name: '1990s', url: '/tex4.png' },
  ];

  const [selectedImage, setSelectedImage] = useState(imageOptions[0].url);

  const handleChange = (e) => {
    setSelectedImage(e.target.value);
  };

  return (
    <div>
      <label>Select a texture: </label>
      <select onChange={handleChange} value={selectedImage}>
        {imageOptions.map((img, index) => (
          <option key={index} value={img.url}>
            {img.name}
          </option>
        ))}
      </select>

      <div style={{ marginTop: '20px' }}>
        <img
          src={selectedImage}
          alt="Selected"
          style={{ width: '300px', border: '1px solid #ccc' }}
        />
      </div>
    </div>
  );
}

export default TextureSelector;
