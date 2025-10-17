---
layout: archive
title: "Research Topics"
permalink: /research/
author_profile: true
---

{% include base_path %}

My research lies at the intersection of **optimization**, **machine learning**, and **scientific computing**. 
I am interested in designing theoretically grounded and computationally efficient algorithms for large-scale problems arising in data science, networked systems, and scientific modeling. 
Below are several major directions of my current and past work.

---

## Distributed Optimization Algorithms
Distributed optimization aims to solve large-scale problems collaboratively across multiple computing agents or data centers, with or without central coordination. 
My research explores both **centralized** and **decentralized** settings, emphasizing **communication-efficient** and **computation-efficient** algorithm design. 
I have developed several accelerated and provably convergent methods for decentralized gradient tracking, compressed communication, and directed network topologies—bridging theory and implementation in large-scale learning and signal processing systems.  

+ [Decentralized Consensus Algorithms](http://mingyan08.github.io/Slides/Decentralized.pdf):  
  This presentation introduces key topics including:
  * Non-accelerated algorithms: DGD, EXTRA/PG-EXTRA, NIDS  
  * Accelerated algorithms: OGT (Optimal Gradient Tracking), OPAPC  
  * Compressed communication: LEAD  
  * Directed graphs: APD (Accelerated Push-DIGing)

---

## Primal–Dual Algorithms
Primal–dual splitting methods are fundamental tools for structured convex and nonconvex optimization. 
I proposed the **PD3O algorithm (Primal–Dual Three-Operator Splitting)**, which unifies and generalizes a family of primal–dual methods. 
My work further explores the **equivalence relationships** among various primal–dual frameworks, providing both mathematical insights and practical algorithms for imaging, inverse problems, and distributed learning.  

+ [Primal–Dual Algorithms](http://mingyan08.github.io/Slides/PD3O.pdf):  
  This presentation covers:
  * PD3O, Condat–Vu, AFBA, PDFP  
  * Chambolle–Pock, PAPC, FDFP2O

---

## Sparse Optimization and Signal Processing
Sparse modeling provides a powerful framework for recovering signals and images from limited or corrupted data. 
My earlier research contributed advances in **nonconvex regularization**, **robust PCA**, and **low-rank matrix recovery**. 
These works combine optimization theory with practical algorithms for **image reconstruction**, **denoising**, and **compressive sensing**, leading to efficient solvers with provable recovery guarantees.

---

## Physics-Informed Neural Networks (PINNs)
Physics-Informed Neural Networks (PINNs) integrate deep learning with physical laws to solve differential equations efficiently. 
My recent work improves accuracy and training efficiency through **novel network architectures** and **smoothness-regularized formulations**. 
This research bridges traditional numerical analysis and modern AI, enabling data-driven discovery and simulation of complex physical systems.

---

## Artificial Intelligence for Mathematical and Optimization Problems
Artificial intelligence provides new perspectives for tackling mathematical and operations research challenges. 
I am broadly interested in leveraging machine learning—including **deep networks** and **reinforcement learning**—to design **adaptive, data-driven optimization algorithms** and **efficient solvers for inverse problems**.

---

_Last updated: {{ site.time | date: "%B %Y" }}_
