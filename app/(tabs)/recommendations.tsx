import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Send, Star, DollarSign } from 'lucide-react-native';
import { useWine } from '@/contexts/WineContext';
import WineCard from '@/components/WineCard';
import { Database } from '@/lib/supabase';

type Wine = Database['public']['Tables']['wines']['Row'];

const MOODS = [
  { emoji: '😢', label: 'Comfort', keywords: ['smooth', 'mellow', 'comforting'] },
  { emoji: '🎉', label: 'Celebration', keywords: ['premium', 'special', 'festive'] },
  { emoji: '😰', label: 'Relaxing', keywords: ['light', 'easy', 'casual'] },
  { emoji: '💕', label: 'Romantic', keywords: ['elegant', 'sophisticated', 'intimate'] },
  { emoji: '🍽️', label: 'Dinner', keywords: ['food pairing', 'bold', 'complex'] },
  { emoji: '☀️', label: 'Summer', keywords: ['refreshing', 'crisp', 'light'] },
];

const PRICE_RANGES = [
  { label: 'Budget ($0-$30)', min: 0, max: 30 },
  { label: 'Mid-range ($30-$80)', min: 30, max: 80 },
  { label: 'Premium ($80-$200)', min: 80, max: 200 },
  { label: 'Luxury ($200+)', min: 200, max: 9999 },
];

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function RecommendationsScreen() {
  const { wines } = useWine();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<typeof PRICE_RANGES[0] | null>(null);
  const [recommendations, setRecommendations] = useState<Wine[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: "Hello! I'm your wine assistant. Tell me your mood, budget, or what you're looking for, and I'll recommend the perfect wine for you. 🍷",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [chatInput, setChatInput] = useState('');

  const getRecommendationsByFilters = () => {
    let filtered = wines;
    
    // Filter by price range
    if (selectedPriceRange) {
      filtered = filtered.filter(w => {
        const price = w.price || 0;
        return price >= selectedPriceRange.min && price <= selectedPriceRange.max;
      });
    }

    // Filter by mood
    if (selectedMood) {
      switch (selectedMood) {
        case 'Comfort':
          filtered = filtered.filter(w => 
            w.type === 'red' && 
            (w.description?.toLowerCase().includes('smooth') || 
             w.food_pairing?.toLowerCase().includes('comfort'))
          );
          break;
        case 'Celebration':
          filtered = filtered.filter(w => 
            (w.price || 0) > 100 || 
            w.rating && w.rating >= 4.5
          );
          break;
        case 'Relaxing':
          filtered = filtered.filter(w => 
            w.type === 'white' || 
            (w.alcohol_percentage || 0) < 13
          );
          break;
        case 'Romantic':
          filtered = filtered.filter(w => 
            w.region?.toLowerCase().includes('france') ||
            w.description?.toLowerCase().includes('elegant')
          );
          break;
        case 'Dinner':
          filtered = filtered.filter(w => 
            w.food_pairing && w.food_pairing.length > 0
          );
          break;
        case 'Summer':
          filtered = filtered.filter(w => 
            w.type === 'white' || 
            w.food_pairing?.toLowerCase().includes('light')
          );
          break;
      }
    }

    // Sort by rating and limit results
    return filtered
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 6);
  };

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(selectedMood === mood ? null : mood);
    updateRecommendations();
  };

  const handlePriceRangeSelect = (range: typeof PRICE_RANGES[0]) => {
    setSelectedPriceRange(selectedPriceRange?.label === range.label ? null : range);
    updateRecommendations();
  };

  const updateRecommendations = () => {
    setTimeout(() => {
      const recs = getRecommendationsByFilters();
      setRecommendations(recs);
    }, 100);
  };

  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('budget') || message.includes('cheap') || message.includes('affordable')) {
      return "For budget-friendly options, I recommend looking at wines under $30. These can still offer great quality and flavor! Try filtering by the Budget price range. 💰";
    } else if (message.includes('expensive') || message.includes('premium') || message.includes('luxury')) {
      return "For premium wines, look at our luxury selection over $200. These wines offer exceptional quality and are perfect for special occasions! 🥂";
    } else if (message.includes('red') || message.includes('bold')) {
      return "Red wines are perfect for bold flavors! Look for wines with good tannins and rich flavors. Try the 'Dinner' mood for food-pairing reds. 🍷";
    } else if (message.includes('white') || message.includes('light') || message.includes('crisp')) {
      return "White wines are refreshing and versatile! Perfect for summer days or lighter meals. Try the 'Summer' or 'Relaxing' moods. 🥂";
    } else if (message.includes('food') || message.includes('pairing') || message.includes('dinner')) {
      return "Food pairing is essential! Try the 'Dinner' mood to see wines with detailed food pairing suggestions. What type of cuisine are you planning? 🍽️";
    } else if (message.includes('celebration') || message.includes('party') || message.includes('special')) {
      return "For celebrations, choose something special! Try the 'Celebration' mood for premium wines perfect for memorable moments. 🎉";
    } else if (message.includes('romantic') || message.includes('date')) {
      return "For romantic occasions, try elegant wines with sophistication. The 'Romantic' mood will show you perfect wines for intimate moments. 💕";
    } else {
      return "I'd love to help you find the perfect wine! Try selecting a mood or price range above, or tell me more about what you're looking for - budget, occasion, or flavor preferences? 🤔🍷";
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: chatInput,
      isUser: true,
      timestamp: new Date(),
    };

    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: getAIResponse(chatInput),
      isUser: false,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage, aiResponse]);
    setChatInput('');

    // Auto-select filters based on user input
    const message = chatInput.toLowerCase();
    if (message.includes('budget') || message.includes('cheap')) {
      setSelectedPriceRange(PRICE_RANGES[0]);
    } else if (message.includes('premium') || message.includes('expensive')) {
      setSelectedPriceRange(PRICE_RANGES[3]);
    }
    
    if (message.includes('celebration')) {
      setSelectedMood('Celebration');
    } else if (message.includes('romantic')) {
      setSelectedMood('Romantic');
    } else if (message.includes('dinner') || message.includes('food')) {
      setSelectedMood('Dinner');
    }

    updateRecommendations();
  };

  const renderChatMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.aiMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.isUser ? styles.userMessageText : styles.aiMessageText
      ]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#722F37', '#8B4B47']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Wine Discovery</Text>
        <Text style={styles.headerSubtitle}>Find your perfect wine match</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How are you feeling?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.moodContainer}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.label}
                  style={[
                    styles.moodButton,
                    selectedMood === mood.label && styles.moodButtonActive
                  ]}
                  onPress={() => handleMoodSelect(mood.label)}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[
                    styles.moodLabel,
                    selectedMood === mood.label && styles.moodLabelActive
                  ]}>
                    {mood.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Price Range Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.priceContainer}>
              {PRICE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.label}
                  style={[
                    styles.priceButton,
                    selectedPriceRange?.label === range.label && styles.priceButtonActive
                  ]}
                  onPress={() => handlePriceRangeSelect(range)}
                >
                  <DollarSign size={16} color={selectedPriceRange?.label === range.label ? 'white' : '#722F37'} />
                  <Text style={[
                    styles.priceLabel,
                    selectedPriceRange?.label === range.label && styles.priceLabelActive
                  ]}>
                    {range.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Recommended for you ({recommendations.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.recommendationsContainer}>
                {recommendations.map((wine) => (
                  <View key={wine.id} style={styles.recommendationCard}>
                    <WineCard wine={wine} />
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* AI Chat Assistant */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <MessageCircle size={20} color="#722F37" style={{ marginRight: 8 }} />
            Chat with Wine Assistant
          </Text>
          
          <View style={styles.chatContainer}>
            <FlatList
              data={chatMessages}
              renderItem={renderChatMessage}
              keyExtractor={(item) => item.id}
              style={styles.chatMessages}
              showsVerticalScrollIndicator={false}
            />
            
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask about wines, budget, or occasions..."
                placeholderTextColor="#8B5A5F"
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !chatInput.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSendMessage}
                disabled={!chatInput.trim()}
              >
                <Send size={20} color={chatInput.trim() ? 'white' : '#8B5A5F'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    color: '#722F37',
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  moodButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    marginRight: 12,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodButtonActive: {
    backgroundColor: '#D4AF37',
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  moodLabel: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#722F37',
    textAlign: 'center',
  },
  moodLabelActive: {
    color: 'white',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  priceContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  priceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceButtonActive: {
    backgroundColor: '#722F37',
  },
  priceLabel: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 12,
    color: '#722F37',
    marginLeft: 4,
  },
  priceLabelActive: {
    color: 'white',
    fontFamily: 'PlayfairDisplay-Bold',
  },
  recommendationsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  recommendationCard: {
    marginRight: 15,
  },
  chatContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatMessages: {
    height: 300,
    marginBottom: 15,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#722F37',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  messageText: {
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  aiMessageText: {
    color: '#333',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 15,
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontFamily: 'PlayfairDisplay-Regular',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#722F37',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5E5',
  },
});