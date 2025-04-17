import { useRef, useEffect } from 'react';
import cv from './opencv';

function OpenCVView({ imagePaths }) {
  const canvasRef = useRef();

  useEffect(() => {
    if (!window.cv || !imagePaths || imagePaths.length < 2) return;

    const canvas = canvasRef.current;
    const scale = 0.6;

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
            // IMPORTANT this always reads 4 channels. Even if it's a single-channel grayscale, it just duplicates the channels :)
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
        loadImageAsMat(imagePaths[7]) // IMPORTANT this reads 4 channels whether or not the image actually is 4-channels or not
      ]);

      // Match sizes if needed
      canvas.width = img1.mat.cols;
      canvas.height = img1.mat.rows;

      cv.imshow(canvas, img1.mat);

      let result_initialized = false;
      let result = new cv.Mat();

      let layers = [img1, img2, img3, img4, img5, img6, img7];

      // either I need to erase the canvas before showing things, or layer 5 is where there's a problem?
      // double-check the layers INDEX-BY-INDEX!

      for (let i = 0; i < layers.length; i++)
      {
        const curr_layer = layers[i].mat;

        // convert to float for multiplication
        const curr_layer_F = new cv.Mat();
        curr_layer.convertTo(curr_layer_F, cv.CV_32F);

        // now separate the channels so that we can single-out the alpha
        const curr_layer_split = new cv.MatVector();
        cv.split(curr_layer_F, curr_layer_split);

        // get the alpha
        const curr_alpha = curr_layer_split.get(3);
        // curr_alpha.convertTo(curr_alpha, cv.CV_32F, 1.0/255.0);

        // construct the 4-channel alpha image
        const alpha_vec = new cv.MatVector();
        alpha_vec.push_back(curr_alpha); alpha_vec.push_back(curr_alpha); alpha_vec.push_back(curr_alpha); alpha_vec.push_back(curr_alpha);

        // merge the 4 together
        const alpha_mult = new cv.Mat();
        cv.merge(alpha_vec, alpha_mult);

        // multiply the channel by the alphas
        const layer_weighted = new cv.Mat();
        cv.multiply(curr_layer_F, alpha_mult, layer_weighted);

        // if this is the first iteration, need to initialize the 'result' output
        if (!result_initialized)
        {
          result = layer_weighted.clone();
          result_initialized = true;
        }
        else {
           cv.add(result, layer_weighted, result);
        }
        
        // free memory (good ol' C++ <3)
        curr_layer_F.delete();
        curr_layer_split.delete();
        layer_weighted.delete();
        curr_alpha.delete();
        alpha_vec.delete();
        alpha_mult.delete();

      }
      
      // Remove alpha (keep only RGB)
      const allChannels = new cv.MatVector();
      cv.split(result, allChannels);

      // manually keep only first 3
      const rgbVec = new cv.MatVector();
      rgbVec.push_back(allChannels.get(0));
      rgbVec.push_back(allChannels.get(1));
      rgbVec.push_back(allChannels.get(2));

      // merge into final RGB result
      const rgbOnly = new cv.Mat();
      cv.merge(rgbVec, rgbOnly);

      // Normalize once at the end
      const finalDisplay = new cv.Mat();
      cv.normalize(rgbOnly, finalDisplay, 0, 255, cv.NORM_MINMAX);
      finalDisplay.convertTo(finalDisplay, cv.CV_8UC3);

      // Display it
      cv.imshow(canvas, finalDisplay);

      // Cleanup
      img1.mat.delete();
      img2.mat.delete();
      img3.mat.delete();
      img4.mat.delete();
      img5.mat.delete();
      img6.mat.delete();
      img7.mat.delete();
      dots.mat.delete();
      result.delete();
      allChannels.delete();
      rgbVec.delete();
      rgbOnly.delete();
      finalDisplay.delete();
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








/*

      // Match sizes if needed
      canvas.width = dots.mat.cols;
      canvas.height = dots.mat.height;

      // console.log(dots.mat.channels())

      cv.imshow(canvas, dots.mat);

      // scalar matrix
      const scal = new cv.Mat(canvas.height, canvas.width, cv.CV_32FC4, new cv.Scalar(5.0, 5.0, 5.0, 1.0));
        // IMPORTANT had to specify 32_FC4 for 4 channels

      // turn dots into float
      const dotsF = new cv.Mat(); dots.mat.convertTo(dotsF, cv.CV_32F);
        // IMPORTANT no need to specify 4 channels because we're converting a 4-channel image

      console.log(dotsF.channels());
      console.log('also ' + scal.channels())

      // scale
      const dotsScaled = new cv.Mat();
      cv.multiply(dotsF, scal, dotsScaled);

      // turn back into int
      const dotsSU = new cv.Mat(); dotsScaled.convertTo(dotsSU, cv.CV_8UC1);

      cv.imshow(canvas, dotsSU);
*/