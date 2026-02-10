// script.js - Gestion du panier interactif

// État du panier (chargé depuis localStorage si disponible)
let panier = JSON.parse(localStorage.getItem('panier')) || [];

// Catalogue de produits (normalement viendrait d'une API)
const produits = {
  'BOR-EX-2019': {
    nom: 'Château Exemple — Bordeaux Rouge 2019',
    prix: 18.90
  },
  'BOU-DE-2021': {
    nom: 'Domaine Démo — Bourgogne Blanc 2021',
    prix: 24.50
  },
  'PRO-RO-2023': {
    nom: 'Cuvée Test — Rosé de Provence 2023',
    prix: 12.90
  },
  'CHP-MM-BRUT': {
    nom: 'Maison Modèle — Champagne Brut',
    prix: 34.00
  }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', function() {
  // Intercepter les formulaires d'ajout au panier
  const formulairesAjout = document.querySelectorAll('form[action="/panier/ajouter"]');
  formulairesAjout.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const sku = this.querySelector('input[name="sku"]').value;
      const quantite = parseInt(this.querySelector('input[name="quantite"]').value);
      ajouterAuPanier(sku, quantite);
    });
  });

  // Afficher le panier au chargement
  afficherPanier();
  
  // Mettre à jour le compteur de panier
  mettreAJourCompteurPanier();
});

// Ajouter un produit au panier
function ajouterAuPanier(sku, quantite) {
  const produitExistant = panier.find(item => item.sku === sku);
  
  if (produitExistant) {
    produitExistant.quantite += quantite;
  } else {
    panier.push({
      sku: sku,
      nom: produits[sku].nom,
      prix: produits[sku].prix,
      quantite: quantite
    });
  }
  
  sauvegarderPanier();
  afficherPanier();
  mettreAJourCompteurPanier();
  afficherNotification(`${produits[sku].nom} ajouté au panier !`);
}

// Modifier la quantité d'un produit
function modifierQuantite(sku, nouvelleQuantite) {
  const produit = panier.find(item => item.sku === sku);
  
  if (produit) {
    if (nouvelleQuantite <= 0) {
      supprimerDuPanier(sku);
    } else {
      produit.quantite = nouvelleQuantite;
      sauvegarderPanier();
      afficherPanier();
      mettreAJourCompteurPanier();
    }
  }
}

// Supprimer un produit du panier
function supprimerDuPanier(sku) {
  panier = panier.filter(item => item.sku !== sku);
  sauvegarderPanier();
  afficherPanier();
  mettreAJourCompteurPanier();
  afficherNotification('Produit retiré du panier');
}

// Vider le panier
function viderPanier() {
  if (confirm('Voulez-vous vraiment vider le panier ?')) {
    panier = [];
    sauvegarderPanier();
    afficherPanier();
    mettreAJourCompteurPanier();
    afficherNotification('Panier vidé');
  }
}

// Sauvegarder le panier dans localStorage
function sauvegarderPanier() {
  localStorage.setItem('panier', JSON.stringify(panier));
}

// Calculer le total du panier
function calculerTotal() {
  return panier.reduce((total, item) => total + (item.prix * item.quantite), 0);
}

// Afficher le panier dans le DOM
function afficherPanier() {
  const tbody = document.querySelector('#panier tbody');
  const tfoot = document.querySelector('#panier tfoot td');
  
  if (!tbody || !tfoot) return;
  
  // Vider le tbody
  tbody.innerHTML = '';
  
  if (panier.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #6b7280;">Votre panier est vide</td></tr>';
    tfoot.innerHTML = '<strong>0,00 €</strong>';
    return;
  }
  
  // Ajouter chaque produit
  panier.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nom}</td>
      <td>${item.sku}</td>
      <td>${item.prix.toFixed(2)} €</td>
      <td>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <button type="button" 
                  onclick="modifierQuantite('${item.sku}', ${item.quantite - 1})"
                  style="padding: 0.25rem 0.5rem; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;"
                  aria-label="Diminuer la quantité">−</button>
          <input type="number" 
                 value="${item.quantite}" 
                 min="1" 
                 onchange="modifierQuantite('${item.sku}', parseInt(this.value))"
                 style="width: 60px; text-align: center; padding: 0.25rem; border: 1px solid #d1d5db; border-radius: 4px;">
          <button type="button" 
                  onclick="modifierQuantite('${item.sku}', ${item.quantite + 1})"
                  style="padding: 0.25rem 0.5rem; background: #e5e7eb; border: none; border-radius: 4px; cursor: pointer;"
                  aria-label="Augmenter la quantité">+</button>
        </div>
      </td>
      <td>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
          <strong>${(item.prix * item.quantite).toFixed(2)} €</strong>
          <button type="button" 
                  onclick="supprimerDuPanier('${item.sku}')"
                  style="padding: 0.25rem 0.5rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;"
                  aria-label="Supprimer ce produit">🗑️</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  // Mettre à jour le total
  tfoot.innerHTML = `<strong>${calculerTotal().toFixed(2)} €</strong>`;
}

// Mettre à jour le compteur de panier dans le header
function mettreAJourCompteurPanier() {
  const totalArticles = panier.reduce((total, item) => total + item.quantite, 0);
  let compteur = document.getElementById('compteur-panier');
  
  if (!compteur) {
    // Créer le compteur s'il n'existe pas
    const lienPanier = document.querySelector('a[href="#panier"]');
    if (lienPanier) {
      compteur = document.createElement('span');
      compteur.id = 'compteur-panier';
      compteur.style.cssText = 'background: #ef4444; color: white; border-radius: 50%; padding: 0.125rem 0.5rem; font-size: 0.875rem; margin-left: 0.5rem; font-weight: bold;';
      lienPanier.appendChild(compteur);
    }
  }
  
  if (compteur) {
    compteur.textContent = totalArticles;
    compteur.style.display = totalArticles > 0 ? 'inline-block' : 'none';
  }
}

// Afficher une notification temporaire
function afficherNotification(message) {
  // Supprimer les notifications existantes
  const ancienneNotif = document.querySelector('.notification-panier');
  if (ancienneNotif) {
    ancienneNotif.remove();
  }
  
  // Créer la nouvelle notification
  const notification = document.createElement('div');
  notification.className = 'notification-panier';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(notification);
  
  // Supprimer après 3 secondes
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Ajouter les animations CSS dynamiquement
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
