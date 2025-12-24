/**
 * Blog Manager - TitanFleet ERP
 * Gestiona las entradas del blog
 */

class BlogManager {
  constructor() {
    this.currentPostId = null;
    this.blogRepo = null;
    this.init();
  }

  async init() {
    // Esperar a que Firebase esté listo
    await this.waitForFirebase();

    // Obtener repositorio para el blog
    await this.createBlogRepo();

    // Cargar entradas
    await this.loadPosts();
  }

  async waitForFirebase() {
    let attempts = 0;
    while (attempts < 50) {
      if (window.firebaseDb && window.fs && window.FirebaseRepoBase) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    console.warn('⚠️ Firebase no está disponible después de 5 segundos');
  }

  async createBlogRepo() {
    // Esperar a que firebaseRepos esté disponible
    let attempts = 0;
    while (attempts < 50) {
      if (window.firebaseRepos && window.firebaseRepos.blog) {
        this.blogRepo = window.firebaseRepos.blog;
        // Asegurar que esté inicializado
        if (!this.blogRepo.db) {
          await this.blogRepo.init();
        }
        console.log('✅ BlogRepo obtenido de firebaseRepos');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    console.warn('⚠️ BlogRepo no está disponible en firebaseRepos');
  }

  async loadPosts() {
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const postsContainer = document.getElementById('blogPostsContainer');

    try {
      // Esperar a que el repositorio esté listo
      if (!this.blogRepo || !this.blogRepo.db) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!this.blogRepo) {
          this.createBlogRepo();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!this.blogRepo || !this.blogRepo.db) {
        throw new Error('BlogRepo no está disponible');
      }

      const posts = await this.blogRepo.getAllPosts();

      // Ocultar loading
      if (loadingState) {
        loadingState.style.display = 'none';
      }

      if (!posts || posts.length === 0) {
        // Mostrar empty state
        if (emptyState) {
          emptyState.style.display = 'block';
        }
        if (postsContainer) {
          postsContainer.style.display = 'none';
        }
        return;
      }

      // Ocultar empty state
      if (emptyState) {
        emptyState.style.display = 'none';
      }
      if (postsContainer) {
        postsContainer.style.display = 'flex';
      }

      // Ordenar por fecha (más recientes primero)
      posts.sort((a, b) => {
        const dateA = new Date(a.fechaCreacion || a.fechaActualizacion || 0);
        const dateB = new Date(b.fechaCreacion || b.fechaActualizacion || 0);
        return dateB - dateA;
      });

      // Renderizar entradas
      this.renderPosts(posts);
    } catch (error) {
      console.error('❌ Error cargando entradas:', error);
      if (loadingState) {
        loadingState.style.display = 'none';
      }
      if (emptyState) {
        emptyState.innerHTML = `
                    <i class="fas fa-exclamation-triangle text-warning"></i>
                    <h3>Error al cargar las entradas</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary mt-3" onclick="window.blogManager.loadPosts()">
                        <i class="fas fa-redo me-2"></i>Reintentar
                    </button>
                `;
        emptyState.style.display = 'block';
      }
    }
  }

  renderPosts(posts) {
    const container = document.getElementById('blogPostsContainer');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    posts.forEach(post => {
      const postCard = this.createPostCard(post);
      container.appendChild(postCard);
    });
  }

  createPostCard(post) {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-4';

    const fecha = new Date(post.fechaCreacion || post.fechaActualizacion || Date.now());
    const fechaFormateada = fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const categoria = post.categoria || 'general';
    const categoriaLabels = {
      feature: 'Nueva Funcionalidad',
      update: 'Actualización',
      announcement: 'Anuncio',
      general: 'General'
    };
    const categoriaLabel = categoriaLabels[categoria] || 'General';

    const excerpt = post.excerpt || `${post.contenido?.substring(0, 150)}...` || 'Sin descripción';

    col.innerHTML = `
            <div class="card blog-post-card h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="blog-tag ${categoria}">${categoriaLabel}</span>
                        <small class="blog-post-meta">
                            <i class="fas fa-calendar me-1"></i>${fechaFormateada}
                        </small>
                    </div>
                    <h5 class="card-title mb-3">${this.escapeHtml(post.titulo || 'Sin título')}</h5>
                    <p class="blog-post-excerpt mb-3">${this.escapeHtml(excerpt)}</p>
                    ${post.autor ? `<p class="text-muted small mb-3"><i class="fas fa-user me-1"></i>${this.escapeHtml(post.autor)}</p>` : ''}
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <button class="btn btn-primary btn-sm w-100" onclick="window.blogManager.viewPost('${post.id}')">
                        <i class="fas fa-eye me-2"></i>Leer Más
                    </button>
                </div>
            </div>
        `;

    return col;
  }

  escapeHtml(text) {
    if (!text) {
      return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async viewPost(postId) {
    try {
      if (!this.blogRepo || !this.blogRepo.db) {
        throw new Error('BlogRepo no está disponible');
      }

      const post = await this.blogRepo.get(postId);
      if (!post) {
        alert('Entrada no encontrada');
        return;
      }

      this.currentPostId = postId;

      const modal = new bootstrap.Modal(document.getElementById('viewPostModal'));
      const titleEl = document.getElementById('viewPostModalTitle');
      const bodyEl = document.getElementById('viewPostModalBody');

      const fecha = new Date(post.fechaCreacion || post.fechaActualizacion || Date.now());
      const fechaFormateada = fecha.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const categoria = post.categoria || 'general';
      const categoriaLabels = {
        feature: 'Nueva Funcionalidad',
        update: 'Actualización',
        announcement: 'Anuncio',
        general: 'General'
      };
      const categoriaLabel = categoriaLabels[categoria] || 'General';

      if (titleEl) {
        titleEl.textContent = post.titulo || 'Sin título';
      }

      if (bodyEl) {
        bodyEl.innerHTML = `
                    <div class="mb-3">
                        <span class="blog-tag ${categoria}">${categoriaLabel}</span>
                        <span class="text-muted ms-3">
                            <i class="fas fa-calendar me-1"></i>${fechaFormateada}
                        </span>
                        ${post.autor ? `<span class="text-muted ms-3"><i class="fas fa-user me-1"></i>${this.escapeHtml(post.autor)}</span>` : ''}
                    </div>
                    <div class="blog-content">
                        ${this.formatContent(post.contenido || 'Sin contenido')}
                    </div>
                `;
      }

      modal.show();
    } catch (error) {
      console.error('❌ Error viendo entrada:', error);
      alert(`Error al cargar la entrada: ${error.message}`);
    }
  }

  formatContent(content) {
    if (!content) {
      return '<p class="text-muted">Sin contenido</p>';
    }
    // Convertir saltos de línea a <br>
    return content.replace(/\n/g, '<br>');
  }

  async savePost() {
    try {
      const titulo = document.getElementById('postTitle').value.trim();
      const contenido = document.getElementById('postContent').value.trim();
      const categoria = document.getElementById('postCategory').value;
      const excerpt = document.getElementById('postExcerpt').value.trim();
      const autor = document.getElementById('postAuthor').value.trim();
      const publicado = document.getElementById('postPublished').checked;

      if (!titulo || !contenido) {
        alert('Por favor, completa el título y el contenido');
        return;
      }

      if (!this.blogRepo || !this.blogRepo.db) {
        throw new Error('BlogRepo no está disponible');
      }

      const postData = {
        titulo,
        contenido,
        categoria,
        excerpt,
        autor: autor || 'Equipo TitanFleet',
        publicado,
        fechaCreacion: this.currentPostId ? undefined : new Date().toISOString()
      };

      const postId = this.currentPostId || `post_${Date.now()}`;

      await this.blogRepo.savePost(postId, postData);

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('postModal'));
      if (modal) {
        modal.hide();
      }

      // Limpiar formulario
      this.resetForm();

      // Recargar entradas
      await this.loadPosts();

      alert('✅ Entrada guardada exitosamente');
    } catch (error) {
      console.error('❌ Error guardando entrada:', error);
      alert(`Error al guardar la entrada: ${error.message}`);
    }
  }

  async editPost() {
    if (!this.currentPostId) {
      return;
    }

    try {
      if (!this.blogRepo || !this.blogRepo.db) {
        throw new Error('BlogRepo no está disponible');
      }

      const post = await this.blogRepo.get(this.currentPostId);
      if (!post) {
        alert('Entrada no encontrada');
        return;
      }

      // Cerrar modal de vista
      const viewModal = bootstrap.Modal.getInstance(document.getElementById('viewPostModal'));
      if (viewModal) {
        viewModal.hide();
      }

      // Llenar formulario
      document.getElementById('postTitle').value = post.titulo || '';
      document.getElementById('postContent').value = post.contenido || '';
      document.getElementById('postCategory').value = post.categoria || 'general';
      document.getElementById('postExcerpt').value = post.excerpt || '';
      document.getElementById('postAuthor').value = post.autor || '';
      document.getElementById('postPublished').checked = post.publicado !== false;

      // Cambiar título del modal
      document.getElementById('postModalLabel').innerHTML =
        '<i class="fas fa-edit me-2"></i>Editar Entrada del Blog';

      // Abrir modal de edición
      const editModal = new bootstrap.Modal(document.getElementById('postModal'));
      editModal.show();
    } catch (error) {
      console.error('❌ Error editando entrada:', error);
      alert(`Error al cargar la entrada para editar: ${error.message}`);
    }
  }

  async deletePost() {
    if (!this.currentPostId) {
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar esta entrada?')) {
      return;
    }

    try {
      if (!this.blogRepo || !this.blogRepo.db) {
        throw new Error('BlogRepo no está disponible');
      }

      await this.blogRepo.delete(this.currentPostId);

      // Cerrar modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('viewPostModal'));
      if (modal) {
        modal.hide();
      }

      // Recargar entradas
      await this.loadPosts();

      alert('✅ Entrada eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando entrada:', error);
      alert(`Error al eliminar la entrada: ${error.message}`);
    }
  }

  resetForm() {
    document.getElementById('postForm').reset();
    document.getElementById('postModalLabel').innerHTML =
      '<i class="fas fa-edit me-2"></i>Nueva Entrada del Blog';
    this.currentPostId = null;
  }

  showCreateModal() {
    this.resetForm();
    const modal = new bootstrap.Modal(document.getElementById('postModal'));
    modal.show();
  }
}

// Funciones globales
window.showCreatePostModal = function () {
  if (window.blogManager) {
    window.blogManager.showCreateModal();
  }
};

window.savePost = function () {
  if (window.blogManager) {
    window.blogManager.savePost();
  }
};

window.editPost = function () {
  if (window.blogManager) {
    window.blogManager.editPost();
  }
};

window.deletePost = function () {
  if (window.blogManager) {
    window.blogManager.deletePost();
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Esperar a que Firebase esté listo
  const initBlog = () => {
    if (window.FirebaseRepoBase) {
      window.blogManager = new BlogManager();
    } else {
      setTimeout(initBlog, 100);
    }
  };

  // Si Firebase ya está listo, inicializar inmediatamente
  if (window.FirebaseRepoBase) {
    window.blogManager = new BlogManager();
  } else {
    // Esperar al evento firebaseReady
    window.addEventListener(
      'firebaseReady',
      () => {
        window.blogManager = new BlogManager();
      },
      { once: true }
    );

    // Timeout de seguridad
    setTimeout(initBlog, 1000);
  }
});

console.log('✅ BlogManager script cargado');
