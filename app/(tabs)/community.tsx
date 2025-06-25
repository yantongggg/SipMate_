import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Share,
  Platform,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Heart, MessageCircle, Share2, Trash2, Users, Send, X, ChevronDown, Wine } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useWine } from '@/contexts/WineContext';

interface CommunityPost {
  id: string;
  user_id: string;
  username: string;
  wine_id: string | null;
  content: string;
  created_at: string;
  wine?: {
    name: string;
    type: string;
    region: string | null;
    winery: string | null;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
  };
}

export default function CommunityScreen() {
  const { user, profile } = useAuth();
  const { wines } = useWine();
  const router = useRouter();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showWineDropdown, setShowWineDropdown] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          user_id,
          username,
          wine_id,
          content,
          created_at,
          wines(name, type, region, winery)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        return;
      }

      // Fetch likes and comments count for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [likesResult, commentsResult, userLikeResult] = await Promise.all([
            supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id),
            supabase
              .from('comments')
              .select('id')
              .eq('post_id', post.id),
            user ? supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle() : Promise.resolve({ data: null })
          ]);

          return {
            ...post,
            likes_count: likesResult.data?.length || 0,
            comments_count: commentsResult.data?.length || 0,
            is_liked: !!userLikeResult.data,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      // First, fetch the comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, user_id, content, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return;
      }

      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        return;
      }

      // Extract unique user IDs
      const userIds = [...new Set(commentsData.map(comment => comment.user_id))];

      // Fetch usernames for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Create a map of user_id to username
      const userMap = new Map();
      (profilesData || []).forEach(profile => {
        userMap.set(profile.id, profile.username);
      });

      // Map comments with usernames
      const commentsWithProfiles = commentsData.map(comment => ({
        ...comment,
        profiles: {
          username: userMap.get(comment.user_id) || 'Unknown User'
        }
      }));

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.is_liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert([{ post_id: postId, user_id: user.id }]);
      }

      // Update local state
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              is_liked: !p.is_liked,
              likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShare = async (post: CommunityPost) => {
    const shareContent = {
      message: `Check out this wine post from ${post.username}: "${post.content}"${post.wine ? ` about ${post.wine.name}` : ''}`,
    };

    try {
      if (Platform.OS === 'ios') {
        await Share.share(shareContent);
      } else {
        await Share.share({ message: shareContent.message });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase
                .from('community_posts')
                .delete()
                .eq('id', postId);
              
              setPosts(prev => prev.filter(p => p.id !== postId));
            } catch (error) {
              console.error('Error deleting post:', error);
            }
          },
        },
      ]
    );
  };

  const handleCreatePost = async () => {
    if (!user || !profile || !newPostContent.trim()) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .insert([{
          user_id: user.id,
          username: profile.username,
          wine_id: selectedWineId,
          content: newPostContent.trim(),
        }]);

      if (error) {
        Alert.alert('Error', 'Failed to create post');
        return;
      }

      setShowCreateModal(false);
      setNewPostContent('');
      setSelectedWineId(null);
      setShowWineDropdown(false);
      await fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post');
    }
  };

  const handleAddComment = async () => {
    if (!user || !profile || !newComment.trim() || !selectedPost) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert([{
          post_id: selectedPost.id,
          user_id: user.id,
          content: newComment.trim(),
        }]);

      if (error) {
        Alert.alert('Error', 'Failed to add comment');
        return;
      }

      setNewComment('');
      await fetchComments(selectedPost.id);
      
      // Update comments count in posts
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id 
          ? { ...p, comments_count: p.comments_count + 1 }
          : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleShowComments = (post: CommunityPost) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
    fetchComments(post.id);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getSelectedWineName = () => {
    if (!selectedWineId) return null;
    const wine = wines.find(w => w.id === selectedWineId);
    return wine ? wine.name : null;
  };

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(item.created_at)}</Text>
        </View>
        
        {user?.id === item.user_id && (
          <View style={styles.postActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeletePost(item.id)}
            >
              <Trash2 size={16} color="#DC3545" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {item.wine && (
        <TouchableOpacity
          style={styles.wineTag}
          onPress={() =>
            router.push({ pathname: '/wine-details', params: { id: item.wine_id } })
          }
        >
          <Text style={styles.wineTagText}>🍷 {item.wine.name}</Text>
          <Text style={styles.wineTagDetails}>
            {[item.wine.winery, item.wine.type, item.wine.region]
              .filter(Boolean)
              .join(' • ')}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.postContent}>{item.content}</Text>

      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleLike(item.id)}
        >
          <Heart
            size={20}
            color={item.is_liked ? '#DC3545' : '#8B5A5F'}
            fill={item.is_liked ? '#DC3545' : 'none'}
          />
          <Text style={[
            styles.footerButtonText,
            item.is_liked && styles.footerButtonTextActive
          ]}>
            {item.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.footerButton}
          onPress={() => handleShowComments(item)}
        >
          <MessageCircle size={20} color="#8B5A5F" />
          <Text style={styles.footerButtonText}>{item.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerButton}
          onPress={() => handleShare(item)}
        >
          <Share2 size={20} color="#8B5A5F" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <Text style={styles.commentUsername}>{item.profiles.username}</Text>
      <Text style={styles.commentContent}>{item.content}</Text>
      <Text style={styles.commentTime}>{formatTimeAgo(item.created_at)}</Text>
    </View>
  );

  const CreatePostModal = () => (
    <Modal visible={showCreateModal} transparent animationType="slide">
      <KeyboardAvoidingView 
        style={styles.modalOverlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Post</Text>
            <TouchableOpacity onPress={() => {
              setShowCreateModal(false);
              setNewPostContent('');
              setSelectedWineId(null);
              setShowWineDropdown(false);
            }}>
              <X size={24} color="#722F37" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.modalScrollContent}
          >
            <TextInput
              style={styles.postInput}
              placeholder="Share your wine experience..."
              placeholderTextColor="#8B5A5F"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />

            <Text style={styles.characterCount}>{newPostContent.length}/500</Text>

            <Text style={styles.sectionLabel}>Link a wine (optional):</Text>
            
            {/* Wine Selection */}
            <TouchableOpacity
              style={styles.wineSelector}
              onPress={() => setShowWineDropdown(!showWineDropdown)}
            >
              <View style={styles.wineSelectorContent}>
                <Wine size={20} color="#722F37" />
                <Text style={[
                  styles.wineSelectorText,
                  !selectedWineId && styles.wineSelectorPlaceholder
                ]}>
                  {getSelectedWineName() || 'Select a wine'}
                </Text>
              </View>
              <ChevronDown 
                size={20} 
                color="#722F37" 
                style={[
                  styles.chevron,
                  showWineDropdown && styles.chevronRotated
                ]}
              />
            </TouchableOpacity>

            {/* Wine Dropdown */}
            {showWineDropdown && (
              <View style={styles.wineDropdown}>
                <ScrollView 
                  style={styles.wineDropdownScroll}
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                >
                  <TouchableOpacity
                    style={[
                      styles.wineOption,
                      !selectedWineId && styles.wineOptionSelected
                    ]}
                    onPress={() => {
                      setSelectedWineId(null);
                      setShowWineDropdown(false);
                    }}
                  >
                    <Text style={styles.wineOptionText}>No wine selected</Text>
                  </TouchableOpacity>
                  
                  {wines.map((wine) => (
                    <TouchableOpacity
                      key={wine.id}
                      style={[
                        styles.wineOption,
                        selectedWineId === wine.id && styles.wineOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedWineId(wine.id);
                        setShowWineDropdown(false);
                      }}
                    >
                      <View style={styles.wineOptionContent}>
                        <Text style={styles.wineOptionText}>{wine.name}</Text>
                        <Text style={styles.wineOptionDetails}>
                          {[wine.winery, wine.type, wine.region]
                            .filter(Boolean)
                            .join(' • ')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.createButton,
                !newPostContent.trim() && styles.createButtonDisabled
              ]}
              onPress={handleCreatePost}
              disabled={!newPostContent.trim()}
            >
              <Text style={styles.createButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  const CommentsModal = () => (
    <Modal visible={showCommentsModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Comments</Text>
            <TouchableOpacity onPress={() => setShowCommentsModal(false)}>
              <X size={24} color="#722F37" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            style={styles.commentsList}
            showsVerticalScrollIndicator={false}
          />

          {user && (
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#8B5A5F"
                value={newComment}
                onChangeText={setNewComment}
                maxLength={200}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newComment.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Send size={20} color={newComment.trim() ? 'white' : '#8B5A5F'} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const handleCreatePost_Button = () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    setShowCreateModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#722F37', '#8B4B47']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Wine Community</Text>
            <Text style={styles.headerSubtitle}>Share your wine experiences</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreatePost_Button}
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {posts.length === 0 && !loading ? (
        <View style={styles.emptyContainer}>
          <Users size={64} color="#8B5A5F" />
          <Text style={styles.emptyTitle}>No posts yet</Text>
          <Text style={styles.emptyMessage}>
            Be the first to share your wine experience with the community!
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.postsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#722F37']}
              tintColor="#722F37"
            />
          }
        />
      )}

      <CreatePostModal />
      <CommentsModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    color: '#F5F5DC',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#F5F5DC',
    opacity: 0.9,
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#722F37',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#8B5A5F',
    textAlign: 'center',
    lineHeight: 24,
  },
  postsList: {
    padding: 20,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#722F37',
    marginBottom: 2,
  },
  timestamp: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#8B5A5F',
  },
  postActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 4,
    marginLeft: 8,
  },
  wineTag: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  wineTagText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 14,
    color: '#722F37',
    marginBottom: 2,
  },
  wineTagDetails: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#8B5A5F',
    textTransform: 'capitalize',
  },
  postContent: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  footerButtonText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#8B5A5F',
    marginLeft: 6,
  },
  footerButtonTextActive: {
    color: '#DC3545',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#722F37',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  postInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 8,
  },
  characterCount: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#8B5A5F',
    textAlign: 'right',
    marginBottom: 16,
  },
  sectionLabel: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: '#722F37',
    marginBottom: 8,
  },
  wineSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 8,
  },
  wineSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  wineSelectorText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 16,
    color: '#722F37',
    marginLeft: 8,
  },
  wineSelectorPlaceholder: {
    color: '#8B5A5F',
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  wineDropdown: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    maxHeight: 200,
    marginBottom: 16,
  },
  wineDropdownScroll: {
    maxHeight: 200,
  },
  wineOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  wineOptionSelected: {
    backgroundColor: '#722F37',
  },
  wineOptionContent: {
    flex: 1,
  },
  wineOptionText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#722F37',
    marginBottom: 2,
  },
  wineOptionDetails: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#8B5A5F',
  },
  createButton: {
    backgroundColor: '#722F37',
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  commentsList: {
    flex: 1,
    padding: 20,
  },
  commentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  commentUsername: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 14,
    color: '#722F37',
    marginBottom: 4,
  },
  commentContent: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  commentTime: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#8B5A5F',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#722F37',
    borderRadius: 20,
    padding: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
});