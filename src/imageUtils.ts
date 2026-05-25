export const compressImage = (file: File, requestedMaxWidth: number = 400, requestedMaxHeight: number = 400, requestedQuality: number = 0.7): Promise<string> => {
   return new Promise((resolve, reject) => {
      // OVERRIDE: To prevent localStorage quota exhausted error (especially at "40 years old"), force maximum compression globally
      const maxWidth = 250;
      const maxHeight = 250;
      const quality = 0.6;
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
         const img = new Image();
         img.src = event.target?.result as string;
         img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Calculate new dimensions
            if (width > height) {
               if (width > maxWidth) {
                  height = Math.round((height * maxWidth) / width);
                  width = maxWidth;
               }
            } else {
               if (height > maxHeight) {
                  width = Math.round((width * maxHeight) / height);
                  height = maxHeight;
               }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
               reject(new Error("Could not get canvas context"));
               return;
            }
            
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress and return as base64
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
         };
         img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
   });
};
