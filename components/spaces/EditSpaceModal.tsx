"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Loader2, Hash, Lock, Globe, Upload, X, ImageIcon, Camera } from "lucide-react";
import { Space } from "@/types/spaces";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";

interface EditSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: Space;
}

export function EditSpaceModal({
  isOpen,
  onClose,
  space,
}: EditSpaceModalProps) {
  const router = useRouter();
  const [name, setName] = useState(space.name);
  const [description, setDescription] = useState(space.description || "");
  const [isPrivate, setIsPrivate] = useState(space.is_private);
  const [tags, setTags] = useState(space.tags?.join(", ") || "");
  const [isLoading, setIsLoading] = useState(false);
  
  // Image state
  const [iconUrl, setIconUrl] = useState(space.icon_url || "");
  const [bannerUrl, setBannerUrl] = useState(space.banner_url || "");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  const iconInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(space.name);
      setDescription(space.description || "");
      setIsPrivate(space.is_private);
      setTags(space.tags?.join(", ") || "");
      setIconUrl(space.icon_url || "");
      setBannerUrl(space.banner_url || "");
      setIconFile(null);
      setBannerFile(null);
      setIconPreview(null);
      setBannerPreview(null);
    }
  }, [isOpen, space]);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Icon must be less than 2MB");
        return;
      }
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Banner must be less than 5MB");
        return;
      }
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const removeIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setIconUrl("");
    if (iconInputRef.current) iconInputRef.current.value = "";
  };

  const removeBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerUrl("");
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const uploadImage = async (file: File, type: 'icon' | 'banner'): Promise<string | null> => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const fileExt = file.name.split('.').pop();
    const fileName = `${space.id}/${type}-${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('space-assets')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${type}:`, error);
      throw new Error(`Failed to upload ${type}: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('space-assets')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleUpdateSpace = async () => {
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      let newIconUrl = iconUrl;
      let newBannerUrl = bannerUrl;

      // Upload new icon if selected
      if (iconFile) {
        setUploadingIcon(true);
        newIconUrl = await uploadImage(iconFile, 'icon') || "";
        setUploadingIcon(false);
      }

      // Upload new banner if selected
      if (bannerFile) {
        setUploadingBanner(true);
        newBannerUrl = await uploadImage(bannerFile, 'banner') || "";
        setUploadingBanner(false);
      }

      const res = await fetch(`/api/spaces/${space.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          is_private: isPrivate,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          icon_url: newIconUrl || null,
          banner_url: newBannerUrl || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update space");
      }

      // Refresh the page to show changes
      router.refresh();
      onClose();
    } catch (error: unknown) {
      console.error("Error updating space:", error);
      const message = error instanceof Error ? error.message : "Failed to update space";
      alert(message);
    } finally {
      setIsLoading(false);
      setUploadingIcon(false);
      setUploadingBanner(false);
    }
  };

  const getGradient = (name: string) => {
    const gradients = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-yellow-500",
      "from-red-500 to-rose-500",
      "from-indigo-500 to-violet-500",
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Space">
      <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto">
        {/* Banner Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Banner Image
          </label>
          <div 
            className={`relative h-32 rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-[#2a2a2a] hover:border-primary/50 transition-colors bg-gradient-to-br ${getGradient(name)}`}
            onClick={() => bannerInputRef.current?.click()}
          >
            {(bannerPreview || bannerUrl) ? (
              <>
                <Image
                  src={bannerPreview || bannerUrl}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeBanner();
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 hover:text-white transition-colors">
                <Upload className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Click to upload banner</span>
                <span className="text-xs opacity-70">Recommended: 1200x400px, max 5MB</span>
              </div>
            )}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Icon Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Space Icon
          </label>
          <div className="flex items-center gap-4">
            <div 
              className="relative h-20 w-20 rounded-2xl overflow-hidden cursor-pointer border-2 border-dashed border-[#2a2a2a] hover:border-primary/50 transition-colors bg-[#18181B] flex items-center justify-center"
              onClick={() => iconInputRef.current?.click()}
            >
              {(iconPreview || iconUrl) ? (
                <>
                  <Image
                    src={iconPreview || iconUrl}
                    alt="Icon preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeIcon();
                    }}
                    className="absolute -top-1 -right-1 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Upload className="h-6 w-6" />
                </div>
              )}
              <input
                ref={iconInputRef}
                type="file"
                accept="image/*"
                onChange={handleIconChange}
                className="hidden"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Upload a custom icon for your space</p>
              <p className="text-xs opacity-70">Recommended: 200x200px, max 2MB</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Space Name</label>
          <Input
            placeholder="e.g. Web Development"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="font-semibold"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="What is this space about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none h-20"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Tags (comma separated)</label>
          <div className="relative">
            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="coding, react, help"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <button
            type="button"
            onClick={() => setIsPrivate(!isPrivate)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${
              isPrivate
                ? "bg-primary/10 border-primary text-primary"
                : "bg-background border-input hover:bg-accent"
            }`}
          >
            {isPrivate ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Globe className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isPrivate ? "Private Space" : "Public Space"}
            </span>
          </button>
          <span className="text-xs text-muted-foreground">
            {isPrivate ? "Only invited members can join." : "Anyone can join."}
          </span>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateSpace}
            disabled={!name.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {uploadingIcon || uploadingBanner ? "Uploading..." : "Updating..."}
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
