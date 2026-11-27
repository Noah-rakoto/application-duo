import { Camera } from "@capacitor/camera";

export default {
    
    async compresser(webPath: string): Promise<string> {     // interne, cours partie 4
        const blob = await (await fetch(webPath)).blob();      // lire l'image locale
        const bitmap = await createImageBitmap(blob);           // la décoder

        const ratio = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');        // un canvas invisible
        canvas.width = Math.round(bitmap.width * ratio);
        canvas.height = Math.round(bitmap.height * ratio);
        canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

        return canvas.toDataURL('image/jpeg', 0.6);             // JPEG qualité 60 %
    },

    async prendrePhoto(): Promise<string | null> {
        let photo;
        try {
            const resultat = Camera.takePhoto({ quality: 60, targetWidth: 800 });

            // une seule depuis la galerie
            photo = (await resultat).webPath || null;

        } catch (error) {
            console.error('Erreur lors de la prise de photo :', error);
        }
        return photo || null;
    },

    async choisirDansGalerie(): Promise<string | null> {
        let photo;
        try {
            const resultat = Camera.chooseFromGallery({ quality: 60, limit: 1 });

            // une seule depuis la galerie
            const images = (await resultat)?.results || [];
            if (images.length > 0) {
                photo = images[0].webPath || null;
            }

        } catch (error) {
            console.error('Erreur lors du choix de photo dans la galerie :', error);
        }
        return photo || null;
    }

}