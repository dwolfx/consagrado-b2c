
export const currentUser = {
    id: "u1",
    name: "Carlos Silva",
    cpf: "123.456.789-00",
    email: "carlos@example.com",
    phone: "(11) 99999-9999",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    privacy: {
        showPhone: false
    }
};

export const currentTab = {
    id: "tab_001",
    establishmentName: "Bar do Zé",
    status: "open",
    table: "12",
    openedAt: "2023-10-27T20:00:00",
    items: [
        {
            id: "i1",
            name: "Garrafa de Vinho Tinto Malbec",
            price: 120.00,
            quantity: 0.25, // 1/4
            sharedWith: [
                { name: "Mariana", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana" },
                { name: "João", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Joao" },
                { name: "Beatriz", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Beatriz" }
            ],
            description: "Divisão de 1 garrafa entre 4 pessoas"
        },
        {
            id: "i2",
            name: "Porção de Batata Frita com Cheddar",
            price: 45.00,
            quantity: 1,
            sharedWith: [],
            description: "Individual"
        },
        {
            id: "i3",
            name: "Balde de Cerveja (6un)",
            price: 60.00,
            quantity: 0.5, // 1/2
            sharedWith: [
                { name: "Pedro", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro" }
            ],
            description: "Divisão de 1 balde entre 2 pessoas"
        }
    ]
};

export const establishments = [
    { id: "e1", name: "Bar do Zé", address: "Rua Augusta, 123", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=100&auto=format&fit=crop" },
    { id: "e2", name: "Pub O'Malleys", address: "Alameda Itu, 456", image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=100&auto=format&fit=crop" },
];

export const menuCategories = [
    { id: "c1", name: "Cervejas", image: "https://images.unsplash.com/photo-1535958636474-b021ee8874a3?auto=format&fit=crop&w=100&q=80" },
    { id: "c2", name: "Drinks", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=100&q=80" },
    { id: "c3", name: "Porções", image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=100&q=80" },
    { id: "c4", name: "Sem Álcool", image: "https://images.unsplash.com/photo-1554526689-b4cb4903328e?auto=format&fit=crop&w=100&q=80" },
];

export const menuItems = [
    { id: "m1", categoryId: "c1", name: "Heineken 600ml", price: 18.00, description: "Garrafa gelada" },
    { id: "m2", categoryId: "c1", name: "Brahma Duplo Malte", price: 14.00, description: "Garrafa 600ml" },
    { id: "m3", categoryId: "c2", name: "Caipirinha de Limão", price: 25.00, description: "Cachaça artesanal" },
    { id: "m4", categoryId: "c2", name: "Gin Tônica", price: 32.00, description: "Tanqueray e especiarias" },
    { id: "m5", categoryId: "c3", name: "Batata Frita", price: 35.00, description: "Com queijo e bacon" },
    { id: "m6", categoryId: "c3", name: "Frango a Passarinho", price: 42.00, description: "1kg de frango crocante" },
];
