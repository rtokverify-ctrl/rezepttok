/**
 * Browser-based video compression using Canvas + MediaRecorder API
 * No external dependencies — uses native browser APIs only.
 * 
 * How it works:
 * 1. Load video into a <video> element
 * 2. Draw downscaled frames onto a <canvas> 
 * 3. Capture the canvas stream via MediaRecorder (WebM VP8/VP9)
 * 4. Return a compressed blob URL
 */

const TARGET_HEIGHT = 720;   // Max height in pixels
const VIDEO_BITRATE = 2_000_000; // 2 Mbps

/**
 * Compress a video in the browser
 * @param {string} videoUri - blob: or object URL of the source video
 * @param {function} onProgress - callback with progress 0-1
 * @returns {Promise<string>} - blob URL of compressed video
 */
export const compressVideoWeb = (videoUri, onProgress) => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';

        video.onloadedmetadata = () => {
            // Calculate target dimensions (maintain aspect ratio)
            const scale = video.videoHeight > TARGET_HEIGHT
                ? TARGET_HEIGHT / video.videoHeight
                : 1;
            const targetWidth = Math.round(video.videoWidth * scale / 2) * 2;  // Ensure even
            const targetHeight = Math.round(video.videoHeight * scale / 2) * 2;

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            // Set up MediaRecorder with the canvas stream
            const stream = canvas.captureStream(30); // 30 fps

            // Try VP9 first (better compression), fall back to VP8
            const mimeTypes = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
            ];
            let selectedMime = '';
            for (const mime of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mime)) {
                    selectedMime = mime;
                    break;
                }
            }

            if (!selectedMime) {
                // Browser doesn't support any video recording — return original
                console.warn('MediaRecorder not supported, skipping compression');
                resolve(videoUri);
                return;
            }

            const recorder = new MediaRecorder(stream, {
                mimeType: selectedMime,
                videoBitsPerSecond: VIDEO_BITRATE,
            });

            const chunks = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: selectedMime });
                const compressedUrl = URL.createObjectURL(blob);

                console.log(`Web compression done: ${(blob.size / 1024 / 1024).toFixed(1)}MB (${selectedMime})`);
                resolve(compressedUrl);
            };

            recorder.onerror = (e) => {
                reject(new Error('MediaRecorder error: ' + e.error));
            };

            // Start recording
            recorder.start(100); // Collect data every 100ms

            // Play video and draw frames to canvas
            let animFrameId;
            const drawFrame = () => {
                if (video.ended || video.paused) return;
                ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

                // Report progress
                if (onProgress && video.duration > 0) {
                    onProgress(video.currentTime / video.duration);
                }

                animFrameId = requestAnimationFrame(drawFrame);
            };

            video.onplay = () => {
                drawFrame();
            };

            video.onended = () => {
                cancelAnimationFrame(animFrameId);
                // Draw the last frame one more time
                ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
                if (onProgress) onProgress(1);

                // Small delay to ensure all data is flushed
                setTimeout(() => {
                    recorder.stop();
                    stream.getTracks().forEach(t => t.stop());
                }, 200);
            };

            video.onerror = () => {
                cancelAnimationFrame(animFrameId);
                reject(new Error('Video loading/playback error'));
            };

            // Start playback (this triggers the recording)
            video.play().catch(reject);
        };

        video.onerror = () => {
            reject(new Error('Failed to load video'));
        };

        video.src = videoUri;
    });
};
