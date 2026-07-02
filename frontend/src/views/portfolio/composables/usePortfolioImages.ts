import { computed, onUnmounted, ref } from 'vue';
import { portfolioService } from '@/services/portfolio.service';
import { resolveImgUrl } from '@/utils/image';
import { useToast } from '@/composables/useToast';

/**
 * Portföy görsel yükleme durumu: bekleyen dosyalar (henüz upload edilmemiş),
 * sunucudaki mevcut görseller (edit modu), önizleme URL'leri ve sürükle-bırak.
 *
 * Yükleme kaydetme anında yapılır: ana view submit'te `pendingFiles`'ı
 * portfolioService.uploadImages'e verir.
 *
 * @param portfolioId Edit modunda mevcut görsel silmek için portföy id'si
 */
export function usePortfolioImages(portfolioId: () => string | undefined) {
  const toast = useToast();

  const fileInput = ref<HTMLInputElement | null>(null);
  const pendingFiles = ref<File[]>([]);
  const previewUrls = ref<string[]>([]);
  const existingImages = ref<string[]>([]); // edit modunda sunucudaki görseller
  const isDragging = ref(false);
  const activeIndex = ref(0);

  const allPreviewUrls = computed(() => [
    ...existingImages.value.map(resolveImgUrl),
    ...previewUrls.value,
  ]);

  function pickFiles() {
    fileInput.value?.click();
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const before = allPreviewUrls.value.length;
    for (const file of Array.from(files)) {
      // Backend whitelist'i ile aynı: JPEG/PNG/WebP
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue;
      pendingFiles.value.push(file);
      previewUrls.value.push(URL.createObjectURL(file));
    }
    if (before === 0 && allPreviewUrls.value.length > 0) activeIndex.value = 0;
  }

  function onFilePick(e: Event) {
    addFiles((e.target as HTMLInputElement).files);
    (e.target as HTMLInputElement).value = '';
  }

  function onDrop(e: DragEvent) {
    isDragging.value = false;
    addFiles(e.dataTransfer?.files ?? null);
  }

  /** Henüz yüklenmemiş (bekleyen) görseli listeden çıkarır. */
  function removePreview(index: number) {
    URL.revokeObjectURL(previewUrls.value[index]);
    previewUrls.value.splice(index, 1);
    pendingFiles.value.splice(index, 1);
    if (activeIndex.value >= allPreviewUrls.value.length) {
      activeIndex.value = Math.max(0, allPreviewUrls.value.length - 1);
    }
  }

  /** Sunucudaki mevcut görseli siler (edit modu). */
  async function removeExistingImage(url: string) {
    const id = portfolioId();
    if (!id) return;
    const idx = existingImages.value.indexOf(url);
    const filename = url.split('/').pop()!;
    try {
      await portfolioService.deleteImage(id, filename);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Görsel silinemedi');
      return;
    }
    existingImages.value = existingImages.value.filter((u) => u !== url);
    if (idx !== -1 && activeIndex.value >= allPreviewUrls.value.length) {
      activeIndex.value = Math.max(0, allPreviewUrls.value.length - 1);
    }
  }

  // Bellek sızıntısını önle: oluşturulan object URL'leri bırak
  onUnmounted(() => previewUrls.value.forEach(URL.revokeObjectURL));

  return {
    fileInput,
    pendingFiles,
    previewUrls,
    existingImages,
    isDragging,
    activeIndex,
    allPreviewUrls,
    pickFiles,
    onFilePick,
    onDrop,
    removePreview,
    removeExistingImage,
  };
}

export type PortfolioImages = ReturnType<typeof usePortfolioImages>;
