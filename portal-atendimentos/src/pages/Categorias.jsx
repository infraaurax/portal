import React, { useState, useRef } from 'react';
import './PageStyles.css';
import './Categorias.css';

const Categorias = () => {
  // Mock data para categorias hierárquicas
  const [categorias] = useState([
    {
      id: 1,
      nome: 'Suporte Técnico',
      nivel: 0,
      pai: null,
      filhos: [
        {
          id: 2,
          nome: 'Hardware',
          nivel: 1,
          pai: 1,
          filhos: [
            { id: 3, nome: 'Computadores', nivel: 2, pai: 2, filhos: [] },
            { id: 4, nome: 'Impressoras', nivel: 2, pai: 2, filhos: [] },
            { id: 5, nome: 'Periféricos', nivel: 2, pai: 2, filhos: [] }
          ]
        },
        {
          id: 6,
          nome: 'Software',
          nivel: 1,
          pai: 1,
          filhos: [
            { id: 7, nome: 'Sistema Operacional', nivel: 2, pai: 6, filhos: [] },
            { id: 8, nome: 'Aplicativos', nivel: 2, pai: 6, filhos: [] }
          ]
        }
      ]
    },
    {
      id: 9,
      nome: 'Atendimento ao Cliente',
      nivel: 0,
      pai: null,
      filhos: [
        {
          id: 10,
          nome: 'Vendas',
          nivel: 1,
          pai: 9,
          filhos: [
            { id: 11, nome: 'Produtos', nivel: 2, pai: 10, filhos: [] },
            { id: 12, nome: 'Serviços', nivel: 2, pai: 10, filhos: [] }
          ]
        },
        {
          id: 13,
          nome: 'Pós-Venda',
          nivel: 1,
          pai: 9,
          filhos: [
            { id: 14, nome: 'Garantia', nivel: 2, pai: 13, filhos: [] },
            { id: 15, nome: 'Troca/Devolução', nivel: 2, pai: 13, filhos: [] }
          ]
        }
      ]
    },
    {
      id: 16,
      nome: 'Financeiro',
      nivel: 0,
      pai: null,
      filhos: [
        {
          id: 17,
          nome: 'Cobrança',
          nivel: 1,
          pai: 16,
          filhos: [
            { id: 18, nome: 'Boletos', nivel: 2, pai: 17, filhos: [] },
            { id: 19, nome: 'Cartão de Crédito', nivel: 2, pai: 17, filhos: [] }
          ]
        }
      ]
    }
  ]);

  const [expandedCategories, setExpandedCategories] = useState(new Set([1, 9, 16]));
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'create', 'edit', 'delete'
  const [formData, setFormData] = useState({ nome: '', pai: null });
  const [contextMenuCategory, setContextMenuCategory] = useState(null);
  
  const longPressTimer = useRef(null);
  const isLongPress = useRef(false);

  const toggleExpanded = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleMouseDown = (category) => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      setContextMenuCategory(category);
      setModalType('context');
      setModalOpen(true);
    }, 800); // 800ms para long press
  };

  const handleMouseUp = (category) => {
    clearTimeout(longPressTimer.current);
    if (!isLongPress.current) {
      // Clique normal - expandir/contrair
      if (category.filhos && category.filhos.length > 0) {
        toggleExpanded(category.id);
      }
      setSelectedCategory(category);
    }
  };

  const handleMouseLeave = () => {
    clearTimeout(longPressTimer.current);
  };

  const openCreateModal = (parentCategory = null) => {
    setFormData({ nome: '', pai: parentCategory?.id || null });
    setContextMenuCategory(parentCategory);
    setModalType('create');
    setModalOpen(true);
  };

  // Função para obter todas as categorias em formato flat para o select
  const getAllCategoriesFlat = (cats = categorias, level = 0, result = []) => {
    cats.forEach(cat => {
      result.push({ 
        id: cat.id, 
        nome: '  '.repeat(level) + cat.nome, 
        nivel: level 
      });
      if (cat.filhos && cat.filhos.length > 0) {
        getAllCategoriesFlat(cat.filhos, level + 1, result);
      }
    });
    return result;
  };

  const openEditModal = (category) => {
    setFormData({ nome: category.nome, pai: category.pai });
    setContextMenuCategory(category);
    setModalType('edit');
    setModalOpen(true);
  };

  const openDeleteModal = (category) => {
    setContextMenuCategory(category);
    setModalType('delete');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalType('');
    setContextMenuCategory(null);
    setFormData({ nome: '', pai: null });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aqui seria a integração com o backend
    console.log('Ação:', modalType, 'Dados:', formData);
    closeModal();
  };

  const renderCategory = (category, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.filhos && category.filhos.length > 0;
    const isSelected = selectedCategory?.id === category.id;

    return (
      <div key={category.id} className="category-item">
        <div 
          className={`category-node level-${level} ${isSelected ? 'selected' : ''} ${hasChildren ? 'has-children' : ''}`}
          onMouseDown={() => handleMouseDown(category)}
          onMouseUp={() => handleMouseUp(category)}
          onMouseLeave={handleMouseLeave}
          style={{ paddingLeft: `${level * 20 + 10}px` }}
        >
          <div className="category-content">
            {hasChildren && (
              <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                ▶
              </span>
            )}
            <span className="category-icon">📁</span>
            <span className="category-name">{category.nome}</span>
          </div>
          <div className="category-actions">
            <button 
              className="btn-add-child"
              onClick={(e) => {
                e.stopPropagation();
                openCreateModal(category);
              }}
              title="Adicionar subcategoria"
            >
              +
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.filhos.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Categorias</h1>
            <p className="page-description">Gerencie categorias de atendimento de forma hierárquica</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => openCreateModal()}
          >
            Nova Categoria Principal
          </button>
        </div>
      </div>
      
      <div className="page-content">
        <div className="categories-container">
          <div className="categories-tree">
            {categorias.map(categoria => renderCategory(categoria))}
          </div>
          
          {selectedCategory && (
            <div className="category-details">
              <h3>Detalhes da Categoria</h3>
              <div className="detail-item">
                <strong>Nome:</strong> {selectedCategory.nome}
              </div>
              <div className="detail-item">
                <strong>Nível:</strong> {selectedCategory.nivel}
              </div>
              <div className="detail-item">
                <strong>Subcategorias:</strong> {selectedCategory.filhos?.length || 0}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Context Menu */}
      {modalOpen && modalType === 'context' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="context-menu" onClick={(e) => e.stopPropagation()}>
            <div className="context-menu-header">
              <h4>{contextMenuCategory?.nome}</h4>
            </div>
            <div className="context-menu-actions">
              <button 
                className="context-action edit"
                onClick={() => openEditModal(contextMenuCategory)}
              >
                ✏️ Editar
              </button>
              <button 
                className="context-action add"
                onClick={() => openCreateModal(contextMenuCategory)}
              >
                ➕ Adicionar Subcategoria
              </button>
              <button 
                className="context-action delete"
                onClick={() => openDeleteModal(contextMenuCategory)}
              >
                🗑️ Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Criar/Editar */}
      {modalOpen && (modalType === 'create' || modalType === 'edit') && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalType === 'create' ? 'Nova Categoria' : 'Editar Categoria'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                 <label htmlFor="nome">Nome da Categoria *</label>
                 <input
                   type="text"
                   id="nome"
                   value={formData.nome}
                   onChange={(e) => setFormData({...formData, nome: e.target.value})}
                   required
                   placeholder="Digite o nome da categoria"
                 />
               </div>
               
               <div className="form-group">
                 <label htmlFor="pai">Categoria Pai</label>
                 <select
                   id="pai"
                   value={formData.pai || ''}
                   onChange={(e) => setFormData({...formData, pai: e.target.value ? parseInt(e.target.value) : null})}
                 >
                   <option value="">Categoria Principal (Nível 0)</option>
                   {getAllCategoriesFlat().map(cat => (
                     <option key={cat.id} value={cat.id}>
                       {cat.nome}
                     </option>
                   ))}
                 </select>
               </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {modalType === 'create' ? 'Criar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Confirmar Exclusão */}
      {modalOpen && modalType === 'delete' && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmar Exclusão</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir a categoria <strong>{contextMenuCategory?.nome}</strong>?</p>
              {contextMenuCategory?.filhos?.length > 0 && (
                <div className="warning-message">
                  ⚠️ Esta categoria possui {contextMenuCategory.filhos.length} subcategoria(s). 
                  Elas também serão excluídas.
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn-danger"
                  onClick={() => {
                    console.log('Excluindo categoria:', contextMenuCategory);
                    closeModal();
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categorias;