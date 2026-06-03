import { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Save, Mail } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import Avatar from '../ui/Avatar.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { toast } from '../../store/toastStore.js';

const MAX_DIM = 256; // downscale avatars to a small square thumbnail

// Reads an image File and returns a compressed square JPEG data URL.
function fileToAvatar(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = MAX_DIM;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX_DIM, MAX_DIM);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProfileModal({ open, onClose }) {
  const { user, updateProfile } = useAuthStore();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  // Reset the form whenever the modal opens.
  useEffect(() => {
    if (open && user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
    }
  }, [open, user]);

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please choose an image file');
    if (file.size > 8 * 1024 * 1024) return toast.error('Image is too large (max 8MB)');
    try {
      const dataUrl = await fileToAvatar(file);
      setAvatar(dataUrl);
    } catch {
      toast.error('Could not read that image');
    } finally {
      e.target.value = ''; // allow re-picking the same file
    }
  }

  async function onSave(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Username cannot be empty');
    setSaving(true);
    try {
      // Send avatar only when it changed; '' resets to auto initials.
      const payload = { name: name.trim() };
      if (avatar !== user.avatar) payload.avatar = avatar;
      await updateProfile(payload);
      toast.success('Profile updated');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  }

  const previewUser = { ...user, name: name || user?.name, avatar };

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <form onSubmit={onSave} className="space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar user={previewUser} size="lg" className="h-20 w-20 text-xl" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-ink shadow ring-2 ring-surface hover:brightness-110"
              title="Upload photo"
            >
              <Camera size={15} />
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
          </div>
          <div className="space-y-1.5">
            <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline py-1.5 text-xs">
              <Camera size={14} /> Upload photo
            </button>
            <button type="button" onClick={() => setAvatar('')} className="btn-ghost py-1.5 text-xs text-muted hover:text-red-500">
              <Trash2 size={14} /> Remove
            </button>
            <p className="text-xs text-faint">JPG or PNG. Square works best.</p>
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="label">Username</label>
          <input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-9 opacity-70" value={user?.email || ''} disabled />
          </div>
          <p className="mt-1 text-xs text-faint">Email can't be changed.</p>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? <Spinner size={16} /> : <><Save size={16} /> Save changes</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}
