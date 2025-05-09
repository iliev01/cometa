import { Component, ChangeDetectionStrategy, OnInit, ViewChild, ElementRef, OnDestroy, HostListener, NgZone, AfterViewInit, ChangeDetectorRef, Renderer2, Inject } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { InputFocusService } from '../../services/inputFocus.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { map, take, debounceTime } from 'rxjs/operators';
import { Store } from '@ngxs/store';
import { Configuration } from '../../store/actions/config.actions';
import { LogService } from '../../services/log.service';

@Component({
  selector: 'cometa-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
  animations: [
    trigger('chatWindow', [
      state('closed', style({
        height: '0',
        opacity: '0'
      })),
      state('open', style({
        opacity: '1'
      })),
      state('minimized', style({
        height: '0',
        opacity: '0'
      })),
      state('maximized', style({
        opacity: '1'
      })),
      transition('closed <=> open', animate('250ms ease-in-out')),
      transition('open <=> minimized', animate('250ms ease-in-out')),
      transition('open <=> maximized', animate('250ms ease-in-out'))
    ])
  ],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TranslateModule
  ]
})
export class ChatbotComponent implements OnInit, AfterViewInit, OnDestroy {
  isOpen$: Observable<boolean>;
  isOpenLocal = false;
  messages$: Observable<ChatMessage[]>;
  isLoading$: Observable<boolean>;
  isMobile$: Observable<boolean>;
  isMobile = false;
  newMessage = '';
  isMinimized = false;
  isMaximized = false;
  isDragging = false;
  
  // Position of the chat window
  chatPosition = {
    x: 20, // Default right offset
    y: 20  // Reduced bottom offset from 80 to 20
  };
  
  // RAG is always enabled but debug info is never shown
  isRagEnabled = true;
  
  // Store the window position and size before maximizing
  private windowState = {
    width: '',
    height: '',
    right: 20,
    bottom: 80
  };
  
  private subscriptions: Subscription[] = [];
  private resizeObserver: ResizeObserver;
  
  // For manual drag implementation
  private isDraggable = true;
  private startPosition = { x: 0, y: 0 };
  private dragListeners: Function[] = [];
  
  // Track the popup window
  private popupWindow: Window | null = null;
  
  // Get current loading state
  private isCurrentlyLoading = false;
  
  // Observable for AI feature status
  isAiFeatureEnabled$: Observable<boolean>;
  isAiFeatureEnabled = false;
  
  @ViewChild('messagesContainer') messagesContainer: ElementRef;
  @ViewChild('chatWindow') chatWindow: ElementRef;
  @ViewChild('chatHeader') chatHeader: ElementRef;

  constructor(
    private chatbotService: ChatbotService,
    private inputFocusService: InputFocusService,
    private breakpointObserver: BreakpointObserver,
    private ngZone: NgZone,
    private store: Store,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
    private log: LogService
  ) { }

  ngOnInit(): void {
    this.log.msg('1', 'Initializing component', 'chatbot');
    this.isOpen$ = this.chatbotService.isOpen$;
    this.messages$ = this.chatbotService.messages$;
    this.isLoading$ = this.chatbotService.isLoading$;
    this.isAiFeatureEnabled$ = this.chatbotService.isAiFeatureEnabled$;
    
    // Subscribe to AI feature status
    this.subscriptions.push(
      this.isAiFeatureEnabled$.subscribe(enabled => {
        this.isAiFeatureEnabled = enabled;
        this.log.msg('1', `AI feature is ${enabled ? 'enabled' : 'disabled'}`, 'chatbot');
      })
    );
    
    // Force closed state on init - explicitly set it in the store
    this.store.dispatch(new Configuration.SetProperty('internal.chatbotOpen', false));
    this.isOpenLocal = false;
    
    // Check if the device is mobile
    this.isMobile$ = this.breakpointObserver.observe([
      Breakpoints.HandsetPortrait,
      Breakpoints.HandsetLandscape
    ]).pipe(
      map(result => result.matches)
    );
    
    // Subscribe to mobile state changes
    this.subscriptions.push(
      this.isMobile$.subscribe(isMobile => {
        this.log.msg('1', 'Mobile state changed', 'chatbot', isMobile);
        this.isMobile = isMobile;
        this.isDraggable = !isMobile && !this.isMaximized;
        
        // Apply mobile-specific styling if needed
        if (isMobile && this.chatWindow && this.chatWindow.nativeElement) {
          const el = this.chatWindow.nativeElement;
          if (this.isOpenLocal && !this.isMinimized) {
            // Ensure full width on mobile when open
            el.style.width = '100%';
            el.style.maxWidth = '100%';
          }
        }
        
        this.cdr.detectChanges();
      })
    );
    
    // Subscribe to loading state
    this.subscriptions.push(
      this.isLoading$.subscribe(isLoading => {
        this.isCurrentlyLoading = isLoading;
      })
    );
    
    // Subscribe to isOpen changes to scroll to bottom when chat opens
    this.subscriptions.push(
      this.isOpen$.subscribe(isOpen => {
        this.log.msg('1', 'Open state changed', 'chatbot', isOpen);
        this.isOpenLocal = isOpen;
        if (isOpen) {
          // Reset minimized and maximized states when opening
          this.isMinimized = false;
          
          // Apply mobile-specific styling if needed
          if (this.isMobile && this.chatWindow && this.chatWindow.nativeElement) {
            const el = this.chatWindow.nativeElement;
            // Ensure full width on mobile when open
            el.style.width = '100%';
            el.style.maxWidth = '100%';
          }
          
          setTimeout(() => {
            this.scrollToBottom();
            this.cdr.detectChanges();
          }, 100);
        }
      })
    );
    
    // Subscribe to messages changes to scroll to bottom when new messages arrive
    this.subscriptions.push(
      this.messages$.subscribe(() => {
        setTimeout(() => {
          this.scrollToBottom();
        }, 100);
      })
    );
  }
  
  ngAfterViewInit(): void {
    this.log.msg('1', 'After view init', 'chatbot');
    
    // Make sure initial state is correct
    if (!this.isOpenLocal && this.chatWindow && this.chatWindow.nativeElement) {
      const el = this.chatWindow.nativeElement;
      // Set initial display state
      this.renderer.addClass(el, 'chat-closed');
      this.renderer.removeClass(el, 'chat-open');
      
      // Set other styles
      el.style.opacity = '0';
      el.style.height = '0';
    } else if (this.isOpenLocal && this.chatWindow && this.chatWindow.nativeElement) {
      const el = this.chatWindow.nativeElement;
      // Set initial display state
      this.renderer.removeClass(el, 'chat-closed');
      this.renderer.addClass(el, 'chat-open');
    }
    
    // Apply mobile-specific styling if needed
    if (this.isMobile && this.chatWindow && this.chatWindow.nativeElement) {
      const el = this.chatWindow.nativeElement;
      // Ensure the chat takes full width on mobile
      if (this.isOpenLocal && !this.isMinimized) {
        el.style.width = '100%';
        el.style.maxWidth = '100%';
      }
    }
    
    // Set up the drag functionality
    this.setupDrag();
  }
  
  ngOnDestroy(): void {
    this.log.msg('1', 'Component destroying', 'chatbot');
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Disconnect ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    // Remove drag listeners
    this.cleanupDragListeners();
    
    // Close popup if open
    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
    }
  }
  
  // Set up manual drag functionality
  private setupDrag(): void {
    if (!this.chatHeader || !this.chatWindow) return;
    
    const header = this.chatHeader.nativeElement;
    const chat = this.chatWindow.nativeElement;
    
    // Add mousedown event listener to header
    this.dragListeners.push(
      this.renderer.listen(header, 'mousedown', (mousedownEvent: MouseEvent) => {
        // Only proceed if not mobile and not maximized
        if (!this.isDraggable || mousedownEvent.button !== 0) return;
        
        // Prevent text selection during drag
        mousedownEvent.preventDefault();
        
        // Start dragging
        this.isDragging = true;
        
        // Get initial positions
        const rect = chat.getBoundingClientRect();
        this.startPosition = {
          x: mousedownEvent.clientX,
          y: mousedownEvent.clientY
        };
        
        const initialLeft = rect.left;
        const initialTop = rect.top;
        
        this.log.msg('1', 'Drag start - Initial position', 'chatbot', { left: initialLeft, top: initialTop });
        
        // Add mousemove event listener to document
        const mousemoveListener = this.renderer.listen('document', 'mousemove', (mousemoveEvent: MouseEvent) => {
          if (!this.isDragging) return;
          
          // Calculate new position
          const dx = mousemoveEvent.clientX - this.startPosition.x;
          const dy = mousemoveEvent.clientY - this.startPosition.y;
          
          let newLeft = initialLeft + dx;
          let newTop = initialTop + dy;
          
          // Ensure the window stays within viewport bounds
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          if (newLeft < 0) newLeft = 0;
          if (newTop < 0) newTop = 0;
          if (newLeft + rect.width > viewportWidth) newLeft = viewportWidth - rect.width;
          if (newTop + rect.height > viewportHeight) newTop = viewportHeight - rect.height;
          
          // Apply the new position
          chat.style.transform = 'translate3d(0,0,0)'; // Reset any transform
          chat.style.position = 'fixed';
          chat.style.left = `${newLeft}px`;
          chat.style.top = `${newTop}px`;
          chat.style.right = 'auto';
          chat.style.bottom = 'auto';
          
          // Force render
          this.cdr.detectChanges();
        });
        
        // Add mouseup event listener to document
        const mouseupListener = this.renderer.listen('document', 'mouseup', () => {
          if (!this.isDragging) return;
          
          // End dragging
          this.isDragging = false;
          
          // Store the final position
          const finalRect = chat.getBoundingClientRect();
          this.windowState.right = window.innerWidth - (finalRect.left + finalRect.width);
          this.windowState.bottom = window.innerHeight - (finalRect.top + finalRect.height);
          
          this.log.msg('1', 'Drag end - Final position', 'chatbot', {
            x: this.chatPosition.x,
            y: this.chatPosition.y,
            right: this.windowState.right,
            bottom: this.windowState.bottom
          });
          
          // Remove event listeners
          mousemoveListener();
          mouseupListener();
          
          // Force render
          this.cdr.detectChanges();
        });
      })
    );
  }
  
  // Clean up drag listeners
  private cleanupDragListeners(): void {
    this.dragListeners.forEach(unlisten => unlisten());
    this.dragListeners = [];
  }

  toggleChat(): void {
    this.log.msg('1', 'Toggle chat - current state', 'chatbot', this.isOpenLocal);
    
    // Update local state first for immediate UI response
    this.isOpenLocal = !this.isOpenLocal;
    
    // Then update the service state
    if (this.isOpenLocal) {
      this.chatbotService.openChat();
      
      // Set the initial position if this is the first open
      if (this.chatWindow && this.chatWindow.nativeElement) {
        const el = this.chatWindow.nativeElement;
        
        // Set display state
        this.renderer.removeClass(el, 'chat-closed');
        this.renderer.addClass(el, 'chat-open');
        
        // Apply mobile-specific styling if needed
        if (this.isMobile) {
          el.style.width = '100%';
          el.style.maxWidth = '100%';
        } else {
          // Set initial position based on chatPosition values
          el.style.bottom = `${this.chatPosition.y}px`;
          el.style.right = `${this.chatPosition.x}px`;
          
          // Initialize the window state with the default position if not set yet
          if (this.windowState.right === undefined) {
            this.windowState.right = this.chatPosition.x;
            this.windowState.bottom = this.chatPosition.y;
          }
        }
      }
    } else {
      this.chatbotService.closeChat();
      
      // Set display state
      if (this.chatWindow && this.chatWindow.nativeElement) {
        // Animation will handle this via the done callback
      }
    }
    
    // Reset states when closing
    if (!this.isOpenLocal && (this.isMinimized || this.isMaximized)) {
      this.isMinimized = false;
      this.isMaximized = false;
    }
    
    this.cdr.detectChanges();
  }

  minimizeChat(event: MouseEvent): void {
    this.log.msg('1', 'Minimize chat', 'chatbot');
    event.stopPropagation();
    
    // Don't allow minimizing on mobile - should directly close instead
    if (this.isMobile) {
      this.toggleChat();
      return;
    }
    
    this.isMinimized = true;
    this.isMaximized = false;
    
    if (this.chatWindow && this.chatWindow.nativeElement) {
      const el = this.chatWindow.nativeElement;
      this.renderer.removeClass(el, 'chat-open');
      // The animation callback will handle the rest
    }
    
    this.cdr.detectChanges();
  }

  maximizeChat(event: MouseEvent): void {
    this.log.msg('1', 'Maximize chat', 'chatbot');
    event.stopPropagation();
    
    if (this.isMaximized) {
      // Restore previous size
      this.isMaximized = false;
      this.isDraggable = !this.isMobile;
      
      if (this.chatWindow && this.chatWindow.nativeElement) {
        const el = this.chatWindow.nativeElement;
        if (this.windowState.width) el.style.width = this.windowState.width;
        if (this.windowState.height) el.style.height = this.windowState.height;
        
        // Restore position
        if (!this.isMobile) {
          el.style.transform = 'translate3d(0,0,0)'; // Reset any transform
          el.style.position = 'fixed';
          
          // Use the saved position
          if (this.windowState.right !== undefined && this.windowState.bottom !== undefined) {
            el.style.bottom = `${this.windowState.bottom}px`;
            el.style.right = `${this.windowState.right}px`;
            el.style.top = 'auto';
            el.style.left = 'auto';
          } else {
            // Fallback to default position if saved state is not available
            el.style.bottom = `${this.chatPosition.y}px`;
            el.style.right = `${this.chatPosition.x}px`;
            el.style.top = 'auto';
            el.style.left = 'auto';
          }
        } else {
          el.style.width = '100%';
          el.style.maxWidth = '100%';
        }
      }
    } else {
      // Save current size and position before maximizing
      if (this.chatWindow && this.chatWindow.nativeElement) {
        const el = this.chatWindow.nativeElement;
        const rect = el.getBoundingClientRect();
        
        // Store current size and position
        this.windowState.width = el.style.width || '';
        this.windowState.height = el.style.height || '';
        this.windowState.right = window.innerWidth - (rect.left + rect.width);
        this.windowState.bottom = window.innerHeight - (rect.top + rect.height);
        
        this.log.msg('1', 'Saved window state', 'chatbot', this.windowState);
      }
      
      // Set maximized state and disable dragging
      this.isMaximized = true;
      this.isDraggable = false;
    }
    
    this.isMinimized = false;
    this.cdr.detectChanges();
    
    // Scroll to bottom after maximizing/restoring
    setTimeout(() => {
      this.scrollToBottom();
    }, 250);
  }

  restoreChat(): void {
    this.log.msg('1', 'Restore chat', 'chatbot');
    this.isMinimized = false;
    
    if (this.chatWindow && this.chatWindow.nativeElement) {
      const el = this.chatWindow.nativeElement;
      this.renderer.addClass(el, 'chat-open');
      
      // Apply mobile-specific styling if needed
      if (this.isMobile) {
        el.style.width = '100%';
        el.style.maxWidth = '100%';
      }
    }
    
    this.cdr.detectChanges();
    
    // Scroll to bottom when restored
    setTimeout(() => {
      this.scrollToBottom();
    }, 250);
  }

  // Send a new message
  sendMessage(): void {
    // Don't send if message is empty or if we're already loading a response or if AI is disabled
    if (this.newMessage.trim() === '' || this.isCurrentlyLoading || !this.isAiFeatureEnabled) return;
    
    // Send the message to service
    this.chatbotService.handleUserMessage(this.newMessage);
    
    // Clear the input
    this.newMessage = '';
  }

  // Method to get current window state
  getChatWindowState(): string {
    if (!this.isOpenLocal) {
      return 'closed';
    }
    if (this.isMinimized) {
      return 'minimized';
    }
    if (this.isMaximized) {
      return 'maximized';
    }
    return 'open';
  }

  // Handle animation done event
  animationDone(event: any): void {
    if (event.toState === 'closed' || event.toState === 'minimized') {
      if (this.chatWindow && this.chatWindow.nativeElement) {
        // Apply display none when animation is done to avoid UI issues
        if (event.toState === 'closed') {
          this.renderer.addClass(this.chatWindow.nativeElement, 'chat-closed');
          this.renderer.removeClass(this.chatWindow.nativeElement, 'chat-open');
        }
      }
    } else if (event.toState === 'open' || event.toState === 'maximized') {
      if (this.chatWindow && this.chatWindow.nativeElement) {
        // Apply display flex when opening
        this.renderer.removeClass(this.chatWindow.nativeElement, 'chat-closed');
        this.renderer.addClass(this.chatWindow.nativeElement, 'chat-open');
      }
    }
    
    this.log.msg('1', `Animation done: ${event.fromState} -> ${event.toState}`, 'chatbot');
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  onInputFocus(): void {
    this.inputFocusService.setInputFocus(true);
  }

  onInputBlur(): void {
    this.inputFocusService.setInputFocus(false);
  }
  
  // Handle escape key to close or restore the chat
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    if (this.isMaximized) {
      this.maximizeChat(new MouseEvent('click'));
    } else if (this.isOpenLocal) {
      this.toggleChat();
    }
  }
  
  // Prevent keyboard shortcuts from the main application when chat is open
  handleKeyboardEvent(event: KeyboardEvent): void {
    // If chat is open, prevent keyboard shortcuts from propagating to the application
    if (this.isOpenLocal) {
      // Allow only specific keys that are needed for chat functionality
      const allowedKeys = ['Enter', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      
      if (!allowedKeys.includes(event.key)) {
        // Stop propagation for all other keyboard events to prevent app shortcuts
        event.stopPropagation();
      }
    }
  }

  // Method to open chatbot in a new window
  openInNewWindow(event: MouseEvent): void {
    event.stopPropagation();
    this.log.msg('1', 'Opening in new window', 'chatbot');
    
    // Close the current chat
    if (this.isOpenLocal) {
      this.chatbotService.closeChat();
      this.isOpenLocal = false;
    }
    
    // Get current messages
    this.messages$.pipe(take(1)).subscribe(messages => {
      try {
        // Create URL with hash-based routing (since useHash is true in the routing config)
        const url = `${this.document.location.origin}/#/chat-popup`;
        
        // Open a new window - use 'popup' as windowName to ensure it opens as a new window
        // Set specific features for a clean popup experience
        this.popupWindow = window.open(
          url, 
          'ChatPopup', 
          'width=800,height=600,resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no,titlebar=no'
        );
        
        if (this.popupWindow) {
          // Set up listener for when popup is closed
          const checkIfClosed = setInterval(() => {
            if (this.popupWindow && this.popupWindow.closed) {
              clearInterval(checkIfClosed);
              this.log.msg('1', 'Popup window was closed', 'chatbot');
              this.popupWindow = null;
            }
          }, 500);
          
          // Focus on the new window
          this.popupWindow.focus();
          
          // Listen for messages from the popup window
          const messageListener = (event: MessageEvent) => {
            if (event.data && event.data.type === 'chat-popup-closed') {
              this.log.msg('1', 'Received close message from popup', 'chatbot');
              if (this.popupWindow) {
                this.popupWindow = null;
              }
            }
          };
          
          window.addEventListener('message', messageListener);
          
          // Clean up the message listener when the popup is closed
          if (this.popupWindow) {
            this.popupWindow.addEventListener('beforeunload', () => {
              window.removeEventListener('message', messageListener);
            });
          }
        } else {
          this.log.msg('1', 'Failed to open popup. Popup may be blocked by browser.', 'chatbot');
          // If popup fails to open, reopen the chat
          this.chatbotService.openChat();
          this.isOpenLocal = true;
        }
      } catch (error) {
        this.log.msg('1', 'Error opening popup', 'chatbot', error);
        // If error occurs, reopen the chat
        this.chatbotService.openChat();
        this.isOpenLocal = true;
      }
    });
  }
} 