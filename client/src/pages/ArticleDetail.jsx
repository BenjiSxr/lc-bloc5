import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API, { getAssetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import CommentCard from '../components/CommentCard';
import { Edit, Trash2, Calendar, User, Send } from 'lucide-react';

const ArticleDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState(null);
    const [commentsError, setCommentsError] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const { data } = await API.get(`/comments/article/${id}`);
                setComments(data);
                setCommentsError(false);
            } catch (err) {
                console.error(err);
                setCommentsError(true);
            }
        };
        fetchComments();
    }, [id]);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const { data } = await API.get(`/articles/${id}`);
                setArticle(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Voulez-vous vraiment supprimer cet article ?')) {
            try {
                await API.delete(`/articles/${id}`);
                navigate('/');
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleCommentUpdate = (commentId, content) => {
        setComments((list) => list.map((comment) => (comment.id === commentId ? { ...comment, content } : comment)));
    };

    const handleCommentDelete = (commentId) => {
        setComments((list) => list.filter((comment) => comment.id !== commentId));
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setSubmitting(true);

        try {
            const { data } = await API.post(`/comments/article/${id}`, { content: newComment });
            setNewComment('');
            setComments((list) => [data, ...(list || [])]);
        } catch (err) {
            console.error(err);
            alert('Erreur lors de la publication du commentaire');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Chargement...</div>;
    if (!article) return <div>Article introuvable.</div>;

    const isOwner = user && user.id === article.user_id;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto' }}>
            <article>
                {article.image && (
                    <img
                        src={getAssetUrl(article.image)}
                        alt={article.title}
                        style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '16px', marginBottom: '30px' }}
                    />
                )}

                <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>{article.title}</h1>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {article.avatar ? (
                            <img src={getAssetUrl(article.avatar)} alt={article.username} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        ) : <User />}
                        <div>
                            <Link to={`/profile/${article.user_id}`} style={{ fontWeight: 'bold' }}>{article.username}</Link>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Calendar size={14} /> {new Date(article.created_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {isOwner && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to={`/edit/${id}`} className="btn glass" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Edit size={16} /> Modifier
                            </Link>
                            <button onClick={handleDelete} className="btn" style={{ padding: '8px 12px', background: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Trash2 size={16} /> Supprimer
                            </button>
                        </div>
                    )}
                </div>

                <div style={{ fontSize: '1.2rem', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                    {article.content}
                </div>
            </article>

            <section style={{ marginTop: '50px', paddingTop: '30px', borderTop: '1px solid var(--border)' }}>
                <h2 style={{ marginBottom: '20px' }}>Commentaires{comments ? ` (${comments.length})` : ''}</h2>

                {user ? (
                    <div className="glass" style={{ padding: '20px', marginBottom: '30px' }}>
                        <form onSubmit={handleCommentSubmit}>
                            <label htmlFor="new-comment" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Votre commentaire</label>
                            <textarea
                                id="new-comment"
                                placeholder="Écrivez votre commentaire ici..."
                                rows="4"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                required
                                style={{ fontFamily: 'inherit' }}
                            />
                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Send size={18} /> {submitting ? 'Publication...' : 'Publier le commentaire'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <p className="glass" style={{ padding: '20px', marginBottom: '30px', color: 'var(--text-muted)' }}>
                        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Connectez-vous</Link> pour laisser un commentaire.
                    </p>
                )}

                {commentsError ? (
                    <p style={{ color: '#ef4444' }}>Impossible de charger les commentaires.</p>
                ) : comments === null ? (
                    <p style={{ color: 'var(--text-muted)' }}>Chargement des commentaires...</p>
                ) : comments.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>Aucun commentaire pour le moment.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {comments.map((comment) => (
                            <CommentCard key={comment.id} comment={comment} onUpdate={handleCommentUpdate} onDelete={handleCommentDelete} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ArticleDetail;
