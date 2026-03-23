#!/usr/bin/env python3
"""
示例实验: MNIST 手写数字分类
初始版本（供 iterate.sh 迭代优化）
"""
import json
import time
from pathlib import Path

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torchvision import datasets, transforms
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

# ── 超参数（Claude 迭代时会修改这里）────────────────
CONFIG = {
    "lr": 0.01,
    "batch_size": 64,
    "epochs": 3,
    "hidden_size": 128,
    "optimizer": "sgd",   # sgd / adam / adamw
    "dropout": 0.0,
}

print(f"实验配置: {json.dumps(CONFIG, indent=2)}")
print(f"PyTorch 可用: {HAS_TORCH}")
print()

if not HAS_TORCH:
    import random
    random.seed(42)
    print("[模拟模式] 无 PyTorch，使用随机数模拟训练")
    best_acc = 0.0
    for epoch in range(1, CONFIG["epochs"] + 1):
        loss = 2.3 * (0.7 ** epoch) + random.uniform(-0.1, 0.1)
        acc  = min(0.5 + epoch * 0.12 + random.uniform(-0.05, 0.05), 0.99)
        best_acc = max(best_acc, acc)
        print(f"Epoch {epoch}/{CONFIG['epochs']} | loss: {loss:.4f} | acc: {acc:.4f}")
        time.sleep(0.5)
    print(f"\n最终准确率: {best_acc:.4f}")
    metrics = {"best_acc": best_acc, "config": CONFIG, "mode": "simulated"}
else:
    transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,))
    ])
    train_data = datasets.MNIST('.', train=True,  download=True, transform=transform)
    test_data  = datasets.MNIST('.', train=False, download=True, transform=transform)
    train_loader = torch.utils.data.DataLoader(
        train_data, batch_size=CONFIG["batch_size"], shuffle=True)
    test_loader  = torch.utils.data.DataLoader(test_data, batch_size=1000)

    class SimpleNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.fc1 = nn.Linear(784, CONFIG["hidden_size"])
            self.drop = nn.Dropout(CONFIG["dropout"])
            self.fc2 = nn.Linear(CONFIG["hidden_size"], 10)
        def forward(self, x):
            x = x.view(-1, 784)
            x = torch.relu(self.fc1(x))
            x = self.drop(x)
            return self.fc2(x)

    model = SimpleNet()
    criterion = nn.CrossEntropyLoss()
    opt_name = CONFIG["optimizer"]
    if opt_name == "adam":
        optimizer = optim.Adam(model.parameters(), lr=CONFIG["lr"])
    elif opt_name == "adamw":
        optimizer = optim.AdamW(model.parameters(), lr=CONFIG["lr"])
    else:
        optimizer = optim.SGD(model.parameters(), lr=CONFIG["lr"], momentum=0.9)

    best_acc = 0.0
    for epoch in range(1, CONFIG["epochs"] + 1):
        model.train(True)
        total_loss = 0
        for data, target in train_loader:
            optimizer.zero_grad()
            loss = criterion(model(data), target)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        avg_loss = total_loss / len(train_loader)

        # 切换到推理模式（等同于 model.eval()）
        model.train(False)
        correct = 0
        with torch.no_grad():
            for data, target in test_loader:
                pred = model(data).argmax(dim=1)
                correct += pred.eq(target).sum().item()
        acc = correct / len(test_data)
        best_acc = max(best_acc, acc)
        print(f"Epoch {epoch}/{CONFIG['epochs']} | loss: {avg_loss:.4f} | acc: {acc:.4f}")

    print(f"\n最终准确率: {best_acc:.4f}")
    metrics = {"best_acc": best_acc, "config": CONFIG, "mode": "pytorch"}

Path("metrics.json").write_text(json.dumps(metrics, indent=2))
print("metrics 已保存到 metrics.json")
