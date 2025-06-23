import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Heart, Sparkles, Coffee, Users, MessageCircle, Send } from 'lucide-react-native';

const moods = [
  { id: 'romantic', name: 'Romantic', icon: Heart, color: '#E91E63' },
  { id: 'celebration', name: 'Celebration', icon: Sparkles, color: '#D4AF37' },
  { id: 'relaxing', name: 'Relaxing', icon: Coffee, color: '#8BC34A' },
  { id: 'social', name: 'Social', icon: Users, color: '#2196F3' },
];

export default function RecommendationsScreen() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; text: string; isUser: boolean }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'mood' | 'chat'>('mood');
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    const mood = moods.find(m => m.id === moodId);
    
    // Mock recommendations based on mood
    let wineRecs: string[] = [];
    switch (moodId) {
      case 'romantic':
        wineRecs = [
          '🍷 Châteauneuf-du-Pape - Perfect for intimate evenings with its rich, complex flavors',
          '🥂 Dom Pérignon - Elegant champagne for romantic celebrations',
          '🍷 Barolo - Sophisticated Italian wine with deep, passionate notes'
        ];
        break;
      case 'celebration':
        wineRecs = [
          '🥂 Krug Grande Cuvée - Premium champagne for special occasions',
          '🍷 Opus One - Luxury Bordeaux blend for milestone celebrations',
          '🥂 Veuve Clicquot - Classic celebration champagne with perfect bubbles'
        ];
        break;
      case 'relaxing':
        wineRecs = [
          '🍷 Pinot Noir from Oregon - Light, smooth, perfect for unwinding',
          '🍾 Sancerre - Crisp white wine ideal for peaceful evenings',
          '🍷 Côtes du Rhône - Easy-drinking red for relaxed moments'
        ];
        break;
      case 'social':
        wineRecs = [
          '🍷 Prosecco - Fun, bubbly wine perfect for group gatherings',
          '🍷 Chianti Classico - Food-friendly Italian wine great for dinner parties',
          '🍾 Albariño - Refreshing Spanish white wine ideal for social settings'
        ];
        break;
    }
    
    setRecommendations(wineRecs);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      isUser: true,
    };

    const aiResponse = {
      id: (Date.now() + 1).toString(),
      text: generateAIResponse(currentMessage),
      isUser: false,
    };

    setChatMessages(prev => [...prev, userMessage, aiResponse]);
    setCurrentMessage('');
  };

  const generateAIResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('red wine') || lowerMessage.includes('red')) {
      return "For red wines, I'd recommend:\n\n🍷 Caymus Cabernet Sauvignon - Rich and bold from Napa Valley\n🍷 Château Margaux - Elegant Bordeaux with complex flavors\n🍷 Barolo - Prestigious Italian wine with earthy notes\n\nWhat kind of occasion or food pairing are you considering?";
    }
    
    if (lowerMessage.includes('white wine') || lowerMessage.includes('white')) {
      return "For white wines, here are my top picks:\n\n🍾 Cloudy Bay Sauvignon Blanc - Crisp and refreshing from New Zealand\n🍾 Dom Pérignon - Premium champagne for special occasions\n🍾 Chablis - Mineral-driven French wine perfect with seafood\n\nAre you looking for something specific like champagne or still wine?";
    }
    
    if (lowerMessage.includes('budget') || lowerMessage.includes('cheap') || lowerMessage.includes('affordable')) {
      return "Great wines don't have to break the bank! Here are some excellent value options:\n\n🍷 Under $30: Côtes du Rhône, Spanish Tempranillo\n🍷 Under $50: Oregon Pinot Noir, Chianti Classico\n🍾 Under $40: Cava, Crémant de Loire\n\nWhat's your ideal price range?";
    }
    
    return "I'd be happy to help you find the perfect wine! Based on our curated collection, I can recommend wines for any occasion. Could you tell me more about:\n\n• What type of wine you prefer (red, white, sparkling)\n• The occasion or mood\n• Your budget range\n• Any food pairings you're considering\n\nThis will help me give you the most personalized recommendations!";
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wine Recommendations</Text>
        <Text style={styles.subtitle}>Discover your perfect wine match</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'mood' && styles.activeTab]}
          onPress={() => setActiveTab('mood')}
        >
          <Text style={[styles.tabText, activeTab === 'mood' && styles.activeTabText]}>
            Mood & Occasion
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
            AI Chat
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'mood' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <Text style={styles.sectionSubtitle}>Select a mood to get personalized wine recommendations</Text>

          <View style={styles.moodsContainer}>
            {moods.map((mood) => {
              const IconComponent = mood.icon;
              return (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodButton,
                    selectedMood === mood.id && styles.selectedMoodButton,
                  ]}
                  onPress={() => handleMoodSelect(mood.id)}
                >
                  <IconComponent 
                    size={32} 
                    color={selectedMood === mood.id ? '#FFFFFF' : mood.color} 
                  />
                  <Text
                    style={[
                      styles.moodText,
                      selectedMood === mood.id && styles.selectedMoodText,
                    ]}
                  >
                    {mood.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {recommendations.length > 0 && (
            <View style={styles.recommendationsContainer}>
              <Text style={styles.recommendationsTitle}>Recommended for you:</Text>
              {recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <KeyboardAvoidingView 
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
            {chatMessages.length === 0 && (
              <View style={styles.welcomeMessage}>
                <MessageCircle size={48} color="#722F37" />
                <Text style={styles.welcomeTitle}>Wine AI Assistant</Text>
                <Text style={styles.welcomeText}>
                  Ask me anything about wines! I can help you find the perfect bottle for any occasion, 
                  food pairing, or budget.
                </Text>
              </View>
            )}
            
            {chatMessages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessage : styles.aiMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    message.isUser ? styles.userMessageText : styles.aiMessageText,
                  ]}
                >
                  {message.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              value={currentMessage}
              onChangeText={setCurrentMessage}
              placeholder="Ask about wines, pairings, or recommendations..."
              placeholderTextColor="#999"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !currentMessage.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!currentMessage.trim()}
            >
              <Send size={20} color={currentMessage.trim() ? '#FFFFFF' : '#999'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#E5E5E5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#722F37',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },
  moodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  moodButton: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedMoodButton: {
    backgroundColor: '#722F37',
  },
  moodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  selectedMoodText: {
    color: '#FFFFFF',
  },
  recommendationsContainer: {
    marginBottom: 32,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#333',
    marginBottom: 16,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recommendationText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeMessage: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    color: '#722F37',
    marginTop: 16,
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#722F37',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    padding: 12,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#722F37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
});