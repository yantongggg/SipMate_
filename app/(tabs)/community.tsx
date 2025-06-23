import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Share,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { Heart, MessageCircle, Share2, Plus, X, LogIn, Wine, Search } from 'lucide-react-native';
import { CommunityPost, Comment, Wine as WineType } from '@/types/wine';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { wineService } from '@/services/wineService';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import WineSelectorModal from '@/components/WineSelectorModal';

export default function CommunityScreen() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [newComment, setNewComment] = useState('');
  const [showWineSelector, setShowWineSelector] = useState(false);
  const [selectedWine, setSelectedWine] = useState<WineType | null>(null);
  const [wines, setWines] = useState<WineType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingWines, setIsLoadingWines] = useState(false);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const { user } = useAuth();
  const { requireAuth } = useAuthGuard();

  useEffect(() => {
    loadPosts();
    loadWines();
  }, []);

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      
      const { data: postsData, error } = await supabase
        .from('community_posts')
        .select(`
          id,
          username,
          content,
          wine_id,
          likes_count,
          created_at,
          wines (
            name,
            winery
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading posts:', error);
        Alert.alert('Error', 'Failed to load community posts');
        return;
      }

      const postsWithComments = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: commentsData } = await supabase
            .from('comments')
            .select('id, username, content, created_at')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            isLiked = !!likeData;
          }

          const comments: Comment[] = (commentsData || []).map(comment => ({
            id: comment.id,
            username: comment.username,
            content: comment.content,
            timestamp: formatTimestamp(comment.created_at),
          }));

          return {
            id: post.id,
            username: post.username,
            content: post.content,
            wineId: post.wine_id,
            wineName: post.wines?.name,
            winery: post.wines?.winery,
            likes: post.likes_count || 0,
            comments,
            timestamp: formatTimestamp(post.created_at),
            isLiked,
          };
        })
      );

      setPosts(postsWithComments);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load community posts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadWines = async () => {
    try {
      setIsLoadingWines(true);
      const allWines = await wineService.getAllWines();
      setWines(allWines);
    } catch (error) {
      console.error('Error loading wines:', error);
      // Don't show alert here, just log the error
    } finally {
      setIsLoadingWines(false);
    }
  };

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadPosts(), loadWines()]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    requireAuth(async () => {
      if (!user) return;

      try {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        if (post.isLiked) {
          await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          await supabase
            .from('community_posts')
            .update({ likes_count: Math.max(0, post.likes - 1) })
            .eq('id', postId);
        } else {
          await supabase
            .from('post_likes')
            .insert({
              post_id: postId,
              user_id: user.id,
            });

          await supabase
            .from('community_posts')
            .update({ likes_count: post.likes + 1 })
            .eq('id', postId);
        }

        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: !p.isLiked,
                  likes: p.isLiked ? p.likes - 1 : p.likes + 1,
                }
              : p
          )
        );
      } catch (error) {
        console.error('Error toggling like:', error);
        Alert.alert('Error', 'Failed to update like status');
      }
    });
  }, [posts, user, requireAuth]);

  const handleShare = useCallback(async (post: CommunityPost) => {
    try {
      const shareContent = post.wineId && post.wineName 
        ? `Check out this wine post about ${post.wineName} from ${post.username}: "${post.content}" - Shared via SipMate`
        : `Check out this wine post from ${post.username}: "${post.content}" - Shared via SipMate`;
      
      await Share.share({
        message: shareContent,
        title: 'Wine Recommendation',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share post');
    }
  }, []);

  const handleAddComment = useCallback(async () => {
    requireAuth(async () => {
      if (!newComment.trim() || !selectedPost || !user) return;

      try {
        const { data, error } = await supabase
          .from('comments')
          .insert({
            post_id: selectedPost.id,
            user_id: user.id,
            username: user.username,
            content: newComment.trim(),
          })
          .select()
          .single();

        if (error) {
          console.error('Error adding comment:', error);
          Alert.alert('Error', 'Failed to add comment');
          return;
        }

        const comment: Comment = {
          id: data.id,
          username: user.username,
          content: newComment.trim(),
          timestamp: 'Just now',
        };

        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === selectedPost.id
              ? { ...post, comments: [...post.comments, comment] }
              : post
          )
        );

        setNewComment('');
        setSelectedPost(prev => prev ? { ...prev, comments: [...prev.comments, comment] } : null);
      } catch (error) {
        console.error('Error adding comment:', error);
        Alert.alert('Error', 'Failed to add comment');
      }
    });
  }, [newComment, selectedPost, user, requireAuth]);

  const handleCreatePost = useCallback(async () => {
    requireAuth(async () => {
      if (!newPostContent.trim() || !user || isCreatingPost) return;

      setIsCreatingPost(true);
      
      try {
        const postData = {
          user_id: user.id,
          username: user.username,
          content: newPostContent.trim(),
          wine_id: selectedWine?.id || null,
          likes_count: 0,
        };

        const { data, error } = await supabase
          .from('community_posts')
          .insert(postData)
          .select(`
            id,
            username,
            content,
            wine_id,
            likes_count,
            created_at,
            wines (
              name,
              winery
            )
          `)
          .single();

        if (error) {
          console.error('Error creating post:', error);
          Alert.alert('Error', 'Failed to create post');
          return;
        }

        const newPost: CommunityPost = {
          id: data.id,
          username: user.username,
          content: newPostContent.trim(),
          wineId: selectedWine?.id,
          wineName: selectedWine?.name,
          winery: selectedWine?.winery,
          likes: 0,
          comments: [],
          timestamp: 'Just now',
          isLiked: false,
        };

        setPosts(prevPosts => [newPost, ...prevPosts]);
        handleCloseNewPostModal();
        Alert.alert('Success', 'Your post has been shared!');
        
      } catch (error) {
        console.error('Error creating post:', error);
        Alert.alert('Error', 'Failed to create post');
      } finally {
        setIsCreatingPost(false);
      }
    });
  }, [newPostContent, user, selectedWine, isCreatingPost, requireAuth]);

  const handleNewPost = useCallback(() => {
    requireAuth(() => {
      setShowNewPostModal(true);
    });
  }, [requireAuth]);

  const handleComments = useCallback((post: CommunityPost) => {
    requireAuth(() => {
      setSelectedPost(post);
      setShowCommentsModal(true);
    });
  }, [requireAuth]);

  const handleLoginPress = useCallback(() => {
    router.push('/auth');
  }, []);

  const handleWineSelect = useCallback((wine: WineType) => {
    setSelectedWine(wine);
    setShowWineSelector(false);
  }, []);

  const handleTagWinePress = useCallback(() => {
    if (wines.length === 0) {
      loadWines();
    }
    setShowWineSelector(true);
  }, [wines.length]);

  const handleRemoveWineTag = useCallback(() => {
    setSelectedWine(null);
  }, []);

  const handleCloseNewPostModal = useCallback(() => {
    Keyboard.dismiss();
    setShowNewPostModal(false);
    setSelectedWine(null);
    setNewPostContent('');
  }, []);

  const handleCloseWineSelectorModal = useCallback(() => {
    setShowWineSelector(false);
  }, []);

  const handleCloseCommentsModal = useCallback(() => {
    Keyboard.dismiss();
    setShowCommentsModal(false);
    setSelectedPost(null);
    setNewComment('');
  }, []);

  const renderPost = useCallback(({ item }: { item: CommunityPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userTextInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </View>
      </View>

      {item.wineId && item.wineName && (
        <View style={styles.wineTag}>
          <Wine size={16} color="#722F37" />
          <View style={styles.wineTagContent}>
            <Text style={styles.wineTagName}>{item.wineName}</Text>
            {item.winery && (
              <Text style={styles.wineTagWinery}>{item.winery}</Text>
            )}
          </View>
        </View>
      )}

      <Text style={styles.postContent}>{item.content}</Text>

      <View style={styles.postActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleLike(item.id)}
        >
          <Heart
            size={20}
            color={item.isLiked ? '#E91E63' : '#666'}
            fill={item.isLiked ? '#E91E63' : 'transparent'}
          />
          <Text style={[styles.actionText, item.isLiked && styles.likedText]}>
            {item.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleComments(item)}
        >
          <MessageCircle size={20} color="#666" />
          <Text style={styles.actionText}>{item.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleShare(item)}
        >
          <Share2 size={20} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [handleLike, handleComments, handleShare]);

  const renderComment = useCallback(({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{item.username.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.commentInfo}>
          <Text style={styles.commentUsername}>{item.username}</Text>
          <Text style={styles.commentTimestamp}>{item.timestamp}</Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
    </View>
  ), []);

  const renderGuestPrompt = useCallback(() => (
    <View style={styles.guestPrompt}>
      <Text style={styles.guestPromptText}>Sign in to join the conversation</Text>
      <TouchableOpacity style={styles.guestLoginButton} onPress={handleLoginPress}>
        <LogIn size={16} color="#FFFFFF" />
        <Text style={styles.guestLoginText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  ), [handleLoginPress]);

  const keyExtractor = useCallback((item: CommunityPost) => item.id, []);
  const commentKeyExtractor = useCallback((item: Comment) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wine Community</Text>
        <Text style={styles.subtitle}>Share your wine experiences</Text>
        {user ? (
          <TouchableOpacity
            style={styles.addPostButton}
            onPress={handleNewPost}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addPostText}>New Post</Text>
          </TouchableOpacity>
        ) : (
          renderGuestPrompt()
        )}
      </View>

      {isLoading && posts.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#722F37" />
          <Text style={styles.loadingText}>Loading community posts...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#722F37']}
              tintColor="#722F37"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No posts yet. Be the first to share!</Text>
            </View>
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
        />
      )}

      {/* New Post Modal */}
      <Modal
        visible={showNewPostModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseNewPostModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCloseNewPostModal}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>New Post</Text>
                <TouchableOpacity
                  onPress={handleCreatePost}
                  disabled={!newPostContent.trim() || isCreatingPost}
                >
                  <Text style={[
                    styles.postButton, 
                    (!newPostContent.trim() || isCreatingPost) && styles.postButtonDisabled
                  ]}>
                    {isCreatingPost ? 'Posting...' : 'Post'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalContent} 
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {selectedWine && (
                  <View style={styles.selectedWineContainer}>
                    <Wine size={16} color="#722F37" />
                    <View style={styles.selectedWineContent}>
                      <Text style={styles.selectedWineName}>{selectedWine.name}</Text>
                      <Text style={styles.selectedWineWinery}>{selectedWine.winery}</Text>
                    </View>
                    <TouchableOpacity onPress={handleRemoveWineTag}>
                      <X size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
                
                <TextInput
                  style={styles.postInput}
                  value={newPostContent}
                  onChangeText={setNewPostContent}
                  placeholder="Share your wine experience, tasting notes, or recommendations..."
                  placeholderTextColor="#999"
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />

                <View style={styles.postActionsContainer}>
                  <TouchableOpacity 
                    style={styles.tagWineButton}
                    onPress={handleTagWinePress}
                  >
                    <Wine size={16} color="#722F37" />
                    <Text style={styles.tagWineText}>Tag a Wine</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.characterCount}>
                    {newPostContent.length}/500 characters
                  </Text>
                </View>
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Wine Selector Modal */}
      <WineSelectorModal
        visible={showWineSelector}
        onClose={handleCloseWineSelectorModal}
        wines={wines}
        onSelect={handleWineSelect}
        isLoading={isLoadingWines}
        onRetryLoad={loadWines}
      />

      {/* Comments Modal */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseCommentsModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCloseCommentsModal}>
                  <X size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Comments</Text>
                <View />
              </View>

              {selectedPost && (
                <>
                  <FlatList
                    data={selectedPost.comments}
                    renderItem={renderComment}
                    keyExtractor={commentKeyExtractor}
                    style={styles.commentsList}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
                      </View>
                    }
                  />

                  {user ? (
                    <View style={styles.commentInputContainer}>
                      <TextInput
                        style={styles.commentInput}
                        value={newComment}
                        onChangeText={setNewComment}
                        placeholder="Add a comment..."
                        placeholderTextColor="#999"
                        multiline
                        maxLength={200}
                      />
                      <TouchableOpacity
                        style={[styles.commentButton, !newComment.trim() && styles.commentButtonDisabled]}
                        onPress={handleAddComment}
                        disabled={!newComment.trim()}
                      >
                        <Text style={[styles.commentButtonText, !newComment.trim() && styles.commentButtonTextDisabled]}>
                          Post
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.commentGuestPrompt}>
                      <Text style={styles.commentGuestText}>Sign in to comment</Text>
                      <TouchableOpacity style={styles.commentGuestButton} onPress={handleLoginPress}>
                        <Text style={styles.commentGuestButtonText}>Sign In</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#722F37',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  addPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#722F37',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  addPostText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  guestPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guestPromptText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  guestLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#722F37',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  guestLoginText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 4,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#722F37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  userTextInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  wineTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#722F37',
  },
  wineTagContent: {
    marginLeft: 8,
    flex: 1,
  },
  wineTagName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#722F37',
    marginBottom: 2,
  },
  wineTagWinery: {
    fontSize: 12,
    color: '#666',
  },
  postContent: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  likedText: {
    color: '#E91E63',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  postButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#722F37',
  },
  postButtonDisabled: {
    color: '#999',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  selectedWineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#722F37',
  },
  selectedWineContent: {
    marginLeft: 8,
    flex: 1,
  },
  selectedWineName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#722F37',
    marginBottom: 2,
  },
  selectedWineWinery: {
    fontSize: 12,
    color: '#666',
  },
  postInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  postActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagWineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F4F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#722F37',
  },
  tagWineText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#722F37',
    fontWeight: '500',
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#722F37',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentAvatarText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  commentInfo: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  commentTimestamp: {
    fontSize: 11,
    color: '#666',
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
    marginRight: 12,
  },
  commentButton: {
    backgroundColor: '#722F37',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentButtonDisabled: {
    backgroundColor: '#CCC',
  },
  commentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  commentButtonTextDisabled: {
    color: '#999',
  },
  commentGuestPrompt: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  commentGuestText: {
    fontSize: 14,
    color: '#666',
  },
  commentGuestButton: {
    backgroundColor: '#722F37',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  commentGuestButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});