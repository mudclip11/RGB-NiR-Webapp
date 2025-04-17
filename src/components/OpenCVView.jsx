import { useRef, useEffect } from 'react';

function OpenCVView({ imagePaths }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!window.cv || !imagePaths || imagePaths.length < 2) return;

    const canvas = canvasRef.current;
    const scale = 0.4;

    const loadImageAsMat = (srcPath) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = srcPath;

        img.onload = () => {
          const tempCanvas = document.createElement("canvas");
          const width = img.width * scale;
          const height = img.height * scale;
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext("2d");
          tempCtx.drawImage(img, 0, 0, width, height);

          const mat = cv.matFromImageData(tempCtx.getImageData(0, 0, width, height));
          resolve({ mat, width, height });
        };
      });
    };

    const processImages = async () => {
      const [img1, img2, img3, img4, img5, img6, img7, dots] = await Promise.all([
        loadImageAsMat(imagePaths[0]),
        loadImageAsMat(imagePaths[1]),
        loadImageAsMat(imagePaths[2]),
        loadImageAsMat(imagePaths[3]),
        loadImageAsMat(imagePaths[4]),
        loadImageAsMat(imagePaths[5]),
        loadImageAsMat(imagePaths[6]),
        loadImageAsMat(imagePaths[7])
      ]);

      // Match sizes if needed
      canvas.width = img1.width;
      canvas.height = img1.height;

    //   cv.imshow(canvas, img4.mat);

      // resize the dot patterns to match the layers
      let dots_new_size = new cv.Mat();
      let dsize = new cv.Size(img4.mat.cols,img4.mat.rows);
      cv.resize(dots.mat, dots_new_size, dsize, 0, 0, cv.INTER_AREA);

      // normalize the dot patterns
      // create a buffer to hold the floating-point version of the new size dots
      const dotsF = new cv.Mat(); 
      dots_new_size.convertTo(dotsF, cv.CV_32F);

      // now normalize the float version
      const dots_norm = new cv.Mat();
      cv.normalize(dotsF, dots_norm, 0.0, 1.0, cv.NORM_MINMAX);

      // bring back to normal range
      const dots_display_range = new cv.Mat();
      cv.normalize(dots_norm, dots_display_range, 0.0, 255.0, cv.NORM_MINMAX);

      // turn back into uint8 for display purposes
      const dotsU8 = new cv.Mat();
      dots_display_range.convertTo(dotsU8, cv.CV_8UC4);


      /* change the alpha map of img4! */

      // split image 4 into its components
      const rgba = new cv.MatVector();
      cv.split(img4.mat, rgba);
      const r = rgba.get(0);
      const g = rgba.get(1);
      const b = rgba.get(2);

      // put output together
      const output = new cv.MatVector();
      output.push_back(r);
      output.push_back(g);
      output.push_back(b);
    
      // important: for adding the alpha, just one channel from dotsU8 is needed
      const dots_split = new cv.MatVector();
      cv.split(dotsU8,dots_split);

      // get the one channel we need
      const final_alpha = dots_split.get(0);

      // add it to output
      output.push_back(final_alpha);

      // merge things together again
      const result = new cv.Mat();
      cv.merge(output, result);

      cv.imshow(canvas, result);

    //   console.log(result.channels());
    
      // Cleanup
      img1.mat.delete();
      img2.mat.delete();
      img3.mat.delete();
      img4.mat.delete();
      img5.mat.delete();
      img6.mat.delete();
      img7.mat.delete();
      dots.mat.delete();
      dots_norm.delete();
      dotsU8.delete();
      rgba.delete();
      result.delete();

    };

    processImages();
  }, [imagePaths]);

  return (
    <div>
      <h3>OpenCV Image Mixer</h3>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}

export default OpenCVView;
















// import { useRef, useEffect } from 'react';

// function OpenCVView({ imagePaths }) {
//   const canvasRef = useRef();

//   useEffect(() => {
//     if (!window.cv) return;

//     const img = new Image();
//     img.src = imagePaths[0];

//     img.onload = () => {
//         const canvas = canvasRef.current;
//         const scale = 0.4;
//         const scaledWidth = img.width * scale;
//         const scaledHeight = img.height * scale;

//         canvas.width = scaledWidth;
//         canvas.height = scaledHeight;

//         const ctx = canvas.getContext("2d");
//         ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

//         const src = cv.matFromImageData(ctx.getImageData(0,0,scaledWidth,scaledHeight));

//         cv.imshow(canvas, src);

//         // delete matrices once we're done w them
//         src.delete();
//     };
//   }, [imagePaths]);

//   return (
//     <div>
//       <h3>OpenCV Image Viewer</h3>
//       <canvas ref={canvasRef}></canvas>
//     </div>
//   );
// }

// export default OpenCVView;

/*
        const canvas = canvasRef.current;
        const scale = 0.4;
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        const src = cv.matFromImageData(ctx.getImageData(0,0,scaledWidth,scaledHeight));

        const rgba = new cv.MatVector();
        cv.split(src, rgba);

        const red = rgba.get(0);
        const green = rgba.get(1);

        // convert to float for multiplication
        const redF = new cv.Mat(); red.convertTo(redF, cv.CV_32F);
        const greenF = new cv.Mat(); red.convertTo(greenF, cv.CV_32F);

        // element-wise mult
        const newBlue = new cv.Mat();
        cv.multiply(redF, greenF, newBlue);

        // normalize the result to [0-255] (display range)
        const blue = new cv.Mat();
        cv.normalize(newBlue, blue, 0, 255, cv.NORM_MINMAX);
        blue.convertTo(blue, cv.CV_8U);

        // construct new output
        const alpha = new cv.Mat(red.rows, red.cols, red.type(), new cv.Scalar(255));
        const output = new cv.MatVector();
        output.push_back(red);
        output.push_back(green);
        output.push_back(blue);
        output.push_back(alpha);

        // merge the output
        const final = new cv.Mat();
        cv.merge(output, final);

        // show the result
        ctx.clearRect(0,0, scaledWidth, scaledHeight);
        cv.imshow(canvas, final);

        src.delete();
        rgba.delete();
        red.delete();
        green.delete();
        redF.delete();
        greenF.delete();
        newBlue.delete();
        blue.delete();
        alpha.delete();
        output.delete();
        final.delete();
*/
