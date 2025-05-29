import FFT from 'fft.js';

/**
 * Pads the array with zeros up to the next power of 2.
 */
function padToPowerOf2(input: number[]): number[] {
  const size = Math.pow(2, Math.ceil(Math.log2(input.length)));
  return [...input, ...new Array(size - input.length).fill(0)];
}

/**
 * Computes amplitude spectrum from a real-valued signal
 */
export function computeAmplitudeSpectrum(inputSignal: number[]): number[] {
  const paddedSignal = padToPowerOf2(inputSignal);
  const fftSize = paddedSignal.length;

  const fft = new FFT(fftSize);
  const input = fft.createComplexArray();
  const output = fft.createComplexArray();

  // Fill input with real values, imag = 0
  for (let i = 0; i < fftSize; i++) {
    input[2 * i] = paddedSignal[i];
    input[2 * i + 1] = 0;
  }

  fft.transform(output, input);

  // Get amplitude spectrum from FFT result (first half only)
  const spectrum: number[] = [];
  for (let i = 0; i < fftSize / 2; i++) {
    const real = output[2 * i];
    const imag = output[2 * i + 1];
    const amplitude = (2 * Math.sqrt(real * real + imag * imag)) / fftSize;
    spectrum.push(amplitude);
  }

  return spectrum;
}
