// Neuron Canvas Animation
class NeuronNetwork {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.neurons = [];
        this.connections = [];
        this.signals = [];
        this.mouse = { x: 0, y: 0 };
        
        this.setupCanvas();
        this.createNeurons();
        this.createConnections();
        this.animate();
        this.setupMouseTracking();
    }
    
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.createNeurons();
            this.createConnections();
        });
    }
    
    setupMouseTracking() {
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
    
    createNeurons() {
        this.neurons = [];
        const numNeurons = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        
        for (let i = 0; i < numNeurons; i++) {
            this.neurons.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                baseRadius: Math.random() * 3 + 2,
                radius: Math.random() * 3 + 2,
                pulseSpeed: Math.random() * 0.02 + 0.01,
                pulsePhase: Math.random() * Math.PI * 2,
                glowIntensity: Math.random() * 0.5 + 0.3,
                lastActivity: 0,
                activityLevel: 0
            });
        }
    }
    
    createConnections() {
        this.connections = [];
        const maxDistance = 150;
        
        for (let i = 0; i < this.neurons.length; i++) {
            for (let j = i + 1; j < this.neurons.length; j++) {
                const distance = this.getDistance(this.neurons[i], this.neurons[j]);
                if (distance < maxDistance) {
                    this.connections.push({
                        from: this.neurons[i],
                        to: this.neurons[j],
                        distance: distance,
                        maxDistance: maxDistance,
                        opacity: 0,
                        targetOpacity: Math.max(0, 1 - distance / maxDistance) * 0.3,
                        lastSignal: 0
                    });
                }
            }
        }
    }
    
    getDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    
    createSignal(from, to) {
        this.signals.push({
            from: from,
            to: to,
            progress: 0,
            speed: Math.random() * 0.02 + 0.01,
            intensity: Math.random() * 0.8 + 0.2,
            life: 1
        });
    }
    
    triggerActivity(x, y, radius = 100) {
        const currentTime = Date.now();
        this.neurons.forEach(neuron => {
            const distance = this.getDistance({ x, y }, neuron);
            if (distance < radius) {
                neuron.lastActivity = currentTime;
                neuron.activityLevel = Math.max(0.8, 1 - distance / radius);
                
                // Create signals from this neuron to nearby ones
                this.connections.forEach(connection => {
                    if ((connection.from === neuron || connection.to === neuron) && 
                        Math.random() < 0.3) {
                        this.createSignal(connection.from, connection.to);
                    }
                });
            }
        });
    }
    
    updateNeurons() {
        const currentTime = Date.now();
        
        this.neurons.forEach(neuron => {
            // Natural pulsing
            neuron.pulsePhase += neuron.pulseSpeed;
            const pulse = Math.sin(neuron.pulsePhase) * 0.3 + 1;
            
            // Activity decay
            if (neuron.lastActivity > 0) {
                const timeSinceActivity = currentTime - neuron.lastActivity;
                neuron.activityLevel = Math.max(0, neuron.activityLevel - timeSinceActivity * 0.001);
            }
            
            // Random activity
            if (Math.random() < 0.001) {
                neuron.lastActivity = currentTime;
                neuron.activityLevel = Math.random() * 0.5 + 0.3;
            }
            
            neuron.radius = neuron.baseRadius * (pulse + neuron.activityLevel);
        });
    }
    
    updateConnections() {
        this.connections.forEach(connection => {
            // Smooth opacity transitions
            const diff = connection.targetOpacity - connection.opacity;
            connection.opacity += diff * 0.05;
            
            // Activity-based brightening
            const avgActivity = (connection.from.activityLevel + connection.to.activityLevel) / 2;
            if (avgActivity > 0.1) {
                connection.opacity = Math.min(1, connection.opacity + avgActivity * 0.5);
            }
        });
    }
    
    updateSignals() {
        this.signals = this.signals.filter(signal => {
            signal.progress += signal.speed;
            signal.life -= 0.01;
            
            if (signal.progress >= 1) {
                // Signal reached destination, trigger activity
                signal.to.lastActivity = Date.now();
                signal.to.activityLevel = signal.intensity;
                return false;
            }
            
            return signal.life > 0;
        });
    }
    
    draw() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        this.connections.forEach(connection => {
            if (connection.opacity > 0.01) {
                this.ctx.beginPath();
                this.ctx.moveTo(connection.from.x, connection.from.y);
                this.ctx.lineTo(connection.to.x, connection.to.y);
                
                const gradient = this.ctx.createLinearGradient(
                    connection.from.x, connection.from.y,
                    connection.to.x, connection.to.y
                );
                
                const fromActivity = connection.from.activityLevel;
                const toActivity = connection.to.activityLevel;
                
                gradient.addColorStop(0, `rgba(0, 255, 255, ${connection.opacity * (0.3 + fromActivity * 0.7)})`);
                gradient.addColorStop(1, `rgba(100, 150, 255, ${connection.opacity * (0.3 + toActivity * 0.7)})`);
                
                this.ctx.strokeStyle = gradient;
                this.ctx.lineWidth = 1 + Math.max(fromActivity, toActivity) * 2;
                this.ctx.stroke();
            }
        });
        
        // Draw signals
        this.signals.forEach(signal => {
            const x = signal.from.x + (signal.to.x - signal.from.x) * signal.progress;
            const y = signal.from.y + (signal.to.y - signal.from.y) * signal.progress;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, Math.PI * 2);
            
            const intensity = signal.intensity * signal.life;
            this.ctx.fillStyle = `rgba(255, 255, 0, ${intensity})`;
            this.ctx.fill();
            
            // Glow effect
            this.ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
            this.ctx.shadowBlur = 10 * intensity;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        });
        
        // Draw neurons
        this.neurons.forEach(neuron => {
            // Outer glow
            const glowRadius = neuron.radius * 3;
            const gradient = this.ctx.createRadialGradient(
                neuron.x, neuron.y, 0,
                neuron.x, neuron.y, glowRadius
            );
            
            const activity = neuron.activityLevel;
            const glowIntensity = (neuron.glowIntensity + activity) * 0.3;
            
            gradient.addColorStop(0, `rgba(0, 255, 255, ${glowIntensity})`);
            gradient.addColorStop(0.3, `rgba(100, 150, 255, ${glowIntensity * 0.5})`);
            gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(neuron.x, neuron.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Core neuron
            this.ctx.beginPath();
            this.ctx.arc(neuron.x, neuron.y, neuron.radius, 0, Math.PI * 2);
            
            const coreIntensity = 0.6 + activity * 0.4;
            this.ctx.fillStyle = `rgba(200, 220, 255, ${coreIntensity})`;
            this.ctx.fill();
            
            // Inner highlight
            this.ctx.beginPath();
            this.ctx.arc(neuron.x - neuron.radius * 0.3, neuron.y - neuron.radius * 0.3, 
                        neuron.radius * 0.4, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + activity * 0.5})`;
            this.ctx.fill();
        });
    }
    
    animate() {
        this.updateNeurons();
        this.updateConnections();
        this.updateSignals();
        this.draw();
        
        // Mouse interaction
        if (this.mouse.x > 0 && this.mouse.y > 0) {
            if (Math.random() < 0.02) {
                this.triggerActivity(this.mouse.x, this.mouse.y, 80);
            }
        }
        
        // Random activity bursts
        if (Math.random() < 0.005) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            this.triggerActivity(x, y, 60);
        }
        
        requestAnimationFrame(() => this.animate());
    }
}

// Chat Functionality
class ChatInterface {
    constructor() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        
        this.setupEventListeners();
        this.scrollToBottom();
    }
    
    setupEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        
        this.messageInput.addEventListener('input', () => {
            this.sendButton.style.opacity = this.messageInput.value.trim() ? '1' : '0.6';
        });
    }
    
    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        this.addMessage(message, 'sent');
        this.messageInput.value = '';
        this.sendButton.style.opacity = '0.6';
        
        // Trigger neural activity on message send
        if (window.neuronNetwork) {
            window.neuronNetwork.triggerActivity(
                window.innerWidth / 2, 
                window.innerHeight / 2, 
                150
            );
        }
        
        // Simulate AI response
        setTimeout(() => this.simulateAIResponse(message), 1000 + Math.random() * 2000);
    }
    
    addMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const time = new Date().toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        if (type === 'sent') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${text}</div>
                    <div class="message-time">${time}</div>
                </div>
                <div class="message-avatar">
                    <div class="avatar user">You</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <div class="avatar">AI</div>
                </div>
                <div class="message-content">
                    <div class="message-text">${text}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Trigger neural activity
        if (window.neuronNetwork) {
            window.neuronNetwork.triggerActivity(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight,
                100
            );
        }
    }
    
    simulateAIResponse(userMessage) {
        const responses = [
            "That's an interesting perspective! The neural patterns in the background are actually responding to our conversation.",
            "I can see the neurons firing as we communicate. It's fascinating how thoughts can be visualized, isn't it?",
            "Your message just triggered a cascade of neural activity! Each word creates new pathways in the network.",
            "The way information flows through neural networks mirrors how our conversation develops - one thought leading to another.",
            "I'm processing your input through thousands of virtual synapses. The background shows a simplified version of this complexity.",
            "Every message creates ripples through the neural network, much like how ideas spread through consciousness.",
            "The firing patterns you see represent the computational processes happening as I understand and respond to you.",
            "It's amazing how these simple nodes and connections can create such complex behaviors, just like in biological brains!"
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        this.addMessage(response, 'received');
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('neuronCanvas');
    window.neuronNetwork = new NeuronNetwork(canvas);
    window.chatInterface = new ChatInterface();
    
    // Initial activity burst
    setTimeout(() => {
        window.neuronNetwork.triggerActivity(
            window.innerWidth / 2,
            window.innerHeight / 2,
            200
        );
    }, 1000);
});

// Handle visibility changes to optimize performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Reduce activity when tab is not visible
        if (window.neuronNetwork) {
            window.neuronNetwork.neurons.forEach(neuron => {
                neuron.pulseSpeed *= 0.1;
            });
        }
    } else {
        // Restore normal activity when tab becomes visible
        if (window.neuronNetwork) {
            window.neuronNetwork.createNeurons();
        }
    }
});