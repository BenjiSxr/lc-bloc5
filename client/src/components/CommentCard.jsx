import { useState } from 'react';
import { Link } from 'react-router-dom';
import API, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Edit, Trash2, Calendar, User, Check, X } from 'lucide-react';

const CommentCard = ({ comment, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    const isOwner = user && user.id === comment.user_id;

    const startEditing = () => {
        setDraft(comment.content);
        setIsEditing(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        setSaving(true);

        try {
            await API.put(`/comments/${comment.id}`, { content: draft });
            setIsEditing(false);
            onUpdate(comment.id, draft);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la modification du commentaire');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
            try {
                await API.delete(`/comments/${comment.id}`);
                onDelete(comment.id);
            } catch (err) {
                console.error(err);
                alert('Erreur lors de la suppression du commentaire');
            }
        }
    };

    return (
        <div className="glass" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {comment.avatar ? (
                        <img
                            src={getAssetUrl(comment.avatar)}
                            alt={comment.username}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    ) : <User size={24} />}
                    <div>
                        <Link to={`/profile/${comment.user_id}`} style={{ fontWeight: 'bold' }}>{comment.username}</Link>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} /> {new Date(comment.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {isOwner && !isEditing && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={startEditing} className="btn glass" style={{ padding: '8px 12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Edit size={16} /> Modifier
                        </button>
                        <button onClick={handleDelete} className="btn" style={{ padding: '8px 12px', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Trash2 size={16} /> Supprimer
                        </button>
                    </div>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleUpdate}>
                    <textarea
                        aria-label="Modifier le commentaire"
                        rows="4"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        required
                        style={{ fontFamily: 'inherit' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Check size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                        <button type="button" onClick={() => setIsEditing(false)} className="btn glass" disabled={saving} style={{ padding: '8px 12px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <X size={16} /> Annuler
                        </button>
                    </div>
                </form>
            ) : (
                <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{comment.content}</p>
            )}
        </div>
    );
};

export default CommentCard;
